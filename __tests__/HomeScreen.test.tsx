import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {TextInput} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {STORAGE_KEYS} from '@/constants/storage';
import {AppProgressBar} from '@/components/AppProgressBar';
import {ThemeProvider} from '@/design/theme/ThemeProvider';
import {HomeScreen} from '@/screens/HomeScreen';
import {
  calculateMonthRemainingProgress,
  calculateWithdrawalBalances,
  startOfLocalDay,
} from '@/utils/counterStorage';

type HomeScreenRenderProps = {
  isMenuVisible?: boolean;
};

const createHomeScreenTree = (props: HomeScreenRenderProps = {}) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <NavigationContainer>
        <HomeScreen {...props} />
      </NavigationContainer>
    </ThemeProvider>
  </SafeAreaProvider>
);

const renderHomeScreen = (props: HomeScreenRenderProps = {}) =>
  render(createHomeScreenTree(props));

const getButtonDisabledState = (buttonNode: {props: Record<string, unknown>}): boolean =>
  Boolean(
    ((buttonNode.props.accessibilityState as {disabled?: boolean} | undefined)?.disabled ??
      buttonNode.props.disabled) as boolean | undefined,
  );

const getAmountFromTextNode = (textNode: {props: {children: string | number | Array<string | number>}}): number => {
  const rawChildren = textNode.props.children;
  const textValue = Array.isArray(rawChildren)
    ? rawChildren.join('')
    : String(rawChildren);

  return Number(textValue.replace('₪', ''));
};

const formatWithdrawalDateForTest = (createdAtIso: string): string => {
  const date = new Date(createdAtIso);
  if (Number.isNaN(date.getTime())) {
    return createdAtIso;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getPressableNodeFromLabel = (
  getByText: (text: string) => {parent: {parent: {props: Record<string, unknown>} | null} | null; props: Record<string, unknown>},
  label: string,
) => {
  const textNode = getByText(label);
  let currentNode: {parent: typeof textNode.parent | null; props: Record<string, unknown>} | null = textNode;

  while (currentNode) {
    if (typeof currentNode.props.onPress === 'function') {
      return currentNode;
    }

    currentNode = currentNode.parent;
  }

  throw new Error(`Unable to locate button node for label "${label}"`);
};

const pressButtonByLabel = (
  getByText: (text: string) => {parent: {parent: {props: Record<string, unknown>} | null} | null; props: Record<string, unknown>},
  label: string,
) => {
  const pressableNode = getPressableNodeFromLabel(getByText, label);
  if (typeof pressableNode.props.onPress !== 'function') {
    throw new Error(`Unable to locate button node for label "${label}"`);
  }

  fireEvent(pressableNode, 'onPress');
};

const getPressableNodeFromTextNode = (
  textNode: {parent: {parent: {props: Record<string, unknown>} | null} | null; props: Record<string, unknown>},
) => {
  let currentNode: {parent: typeof textNode.parent | null; props: Record<string, unknown>} | null = textNode;

  while (currentNode) {
    if (typeof currentNode.props.onPress === 'function') {
      return currentNode;
    }

    currentNode = currentNode.parent;
  }

  throw new Error('Unable to locate pressable node for text node');
};

const pressTotalAmountButton = (
  getByTestId: (
    testId: string,
  ) => {parent: {parent: {props: Record<string, unknown>} | null} | null; props: Record<string, unknown>},
) => {
  const totalAmountText = getByTestId('home-total-amount-value');
  const pressableNode = getPressableNodeFromTextNode(totalAmountText);
  fireEvent(pressableNode, 'onPress');
};

const pressWithdrawalHistoryRowByDate = (
  getByText: (text: string) => {parent: {parent: {props: Record<string, unknown>} | null} | null; props: Record<string, unknown>},
  createdAtIso: string,
) => {
  const dateLabel = formatWithdrawalDateForTest(createdAtIso);
  const rowDateText = getByText(dateLabel);
  const pressableNode = getPressableNodeFromTextNode(rowDateText);
  fireEvent(pressableNode, 'onPress');
};

describe('HomeScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('renders branding credit at the bottom of the home screen', async () => {
    const {getByTestId, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByTestId('home-branding-credit')).toBeTruthy();
    });

    expect(getByText('powered by willpower.')).toBeTruthy();
  });

  it('shows month completed value and progress in the this month card', async () => {
    const {UNSAFE_getByType, getByText} = renderHomeScreen();

    await waitFor(() => {
      const remainingRatio = calculateMonthRemainingProgress(new Date()).remainingRatio;
      const expectedCompletedPercent = Math.round((1 - remainingRatio) * 100);

      expect(getByText(`Month Completed: ${expectedCompletedPercent}%`)).toBeTruthy();
      expect(UNSAFE_getByType(AppProgressBar).props.progress).toBeCloseTo(
        1 - remainingRatio,
        1,
      );
    });
  });

  it('keeps total amount action disabled when only current month total exists', async () => {
    const today = startOfLocalDay(new Date());
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, today.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '45'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {getByRole, getByTestId, queryByRole, queryByText} = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
    });

    const totalAmountButton = getByRole('button', {
      name: 'Withdraw from total amount',
    });
    expect(getButtonDisabledState(totalAmountButton)).toBe(true);
    expect(queryByRole('button', {name: 'Withdraw'})).toBeNull();

    pressTotalAmountButton(getByTestId);

    expect(queryByText(/You can withdraw only from past months/)).toBeNull();
  });

  it('opens withdraw dialog when pressing the total amount and withdrawals are available', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const expectedMaxAmount = calculateWithdrawalBalances(
      previousMonthStart,
      10,
      now,
      [],
    ).pastAccumulatedAvailable;
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {getByRole, getByTestId, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
    });

    const totalAmountButton = getByRole('button', {
      name: 'Withdraw from total amount',
    });
    expect(getButtonDisabledState(totalAmountButton)).toBe(false);
    expect(
      getAmountFromTextNode(getByTestId('home-total-amount-value')),
    ).toBe(expectedMaxAmount);

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
    });
  });

  it('shows error and keeps confirm disabled for empty or illegal amount', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const expectedMaxAmount = calculateWithdrawalBalances(
      previousMonthStart,
      10,
      now,
      [],
    ).pastAccumulatedAvailable;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {UNSAFE_getByType, getByRole, getByTestId, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
    });

    const totalAmountButton = getByRole('button', {
      name: 'Withdraw from total amount',
    });
    expect(getButtonDisabledState(totalAmountButton)).toBe(false);

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
      expect(getByText('Confirm')).toBeTruthy();
    });

    pressButtonByLabel(getByText, 'Confirm');
    expect(getByText(/You can withdraw only from past months/)).toBeTruthy();

    fireEvent.changeText(UNSAFE_getByType(TextInput), '9999');

    expect(
      getByText(`Enter a whole number from 1 to ₪${expectedMaxAmount}.`),
    ).toBeTruthy();
    pressButtonByLabel(getByText, 'Confirm');
    expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
  });

  it('saves a valid withdrawal, updates total, shows success toast, and renders history', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {UNSAFE_getByType, getByRole, getByTestId, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
      expect(getByTestId('home-total-amount-value')).toBeTruthy();
      expect(getByTestId('home-absolute-total-value')).toBeTruthy();
    });

    const initialOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );
    const initialAbsoluteTotalAmount = getAmountFromTextNode(
      getByTestId('home-absolute-total-value'),
    );

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText('Confirm')).toBeTruthy();
    });

    fireEvent.changeText(UNSAFE_getByType(TextInput), '50');

    pressButtonByLabel(getByText, 'Confirm');

    await waitFor(() => {
      expect(getByText('Withdrawal successful: ₪50')).toBeTruthy();
      expect(getByText('₪50')).toBeTruthy();
    });

    const updatedOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );
    const updatedAbsoluteTotalAmount = getAmountFromTextNode(
      getByTestId('home-absolute-total-value'),
    );
    expect(updatedOverallAmount).toBe(initialOverallAmount - 50);
    expect(updatedAbsoluteTotalAmount).toBe(initialAbsoluteTotalAmount);
  });

  it('does not save withdrawal on keyboard done, only on confirm', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {UNSAFE_getByType, getByRole, getByTestId, getByText, queryByText} =
      renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
      expect(getByTestId('home-total-amount-value')).toBeTruthy();
    });

    const initialOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText('Confirm')).toBeTruthy();
    });

    const withdrawInput = UNSAFE_getByType(TextInput);
    fireEvent.changeText(withdrawInput, '50');
    fireEvent(withdrawInput, 'submitEditing', {
      nativeEvent: {text: '50'},
    });

    await waitFor(() => {
      expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
      expect(getByText('Confirm')).toBeTruthy();
    });

    expect(queryByText('Withdrawal successful: ₪50')).toBeNull();

    pressButtonByLabel(getByText, 'Confirm');

    await waitFor(() => {
      expect(getByText('Withdrawal successful: ₪50')).toBeTruthy();
    });

    const updatedOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );
    expect(updatedOverallAmount).toBe(initialOverallAmount - 50);
  });

  it('opens withdrawal details when pressing a history row', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const historyEntry = {
      amount: 42,
      createdAtIso: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1))
        .toISOString(),
      id: 'history-entry-42',
    };
    const expectedDateLabel = formatWithdrawalDateForTest(historyEntry.createdAtIso);

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, JSON.stringify([historyEntry])],
    ]);

    const {getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByText(`₪${historyEntry.amount}`)).toBeTruthy();
      expect(getByText(expectedDateLabel)).toBeTruthy();
    });

    pressWithdrawalHistoryRowByDate(getByText, historyEntry.createdAtIso);

    await waitFor(() => {
      expect(getByText('Withdrawal details')).toBeTruthy();
      expect(getByText(`Amount: ₪${historyEntry.amount}`)).toBeTruthy();
      expect(getByText(`Date: ${expectedDateLabel}`)).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });
  });

  it('keeps withdrawal details content visible while the dialog is closing', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const historyEntry = {
      amount: 42,
      createdAtIso: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1))
        .toISOString(),
      id: 'history-entry-close-42',
    };
    const expectedDateLabel = formatWithdrawalDateForTest(historyEntry.createdAtIso);

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, JSON.stringify([historyEntry])],
    ]);

    const {getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByText(expectedDateLabel)).toBeTruthy();
    });

    pressWithdrawalHistoryRowByDate(getByText, historyEntry.createdAtIso);

    await waitFor(() => {
      expect(getByText('Withdrawal details')).toBeTruthy();
      expect(getByText(`Amount: ₪${historyEntry.amount}`)).toBeTruthy();
      expect(getByText(`Date: ${expectedDateLabel}`)).toBeTruthy();
    });

    pressButtonByLabel(getByText, 'Cancel');

    expect(getByText(`Amount: ₪${historyEntry.amount}`)).toBeTruthy();
    expect(getByText(`Date: ${expectedDateLabel}`)).toBeTruthy();
  });

  it('deletes selected withdrawal entry, updates total, and removes the row', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const historyEntries = [
      {
        amount: 35,
        createdAtIso: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 2))
          .toISOString(),
        id: 'history-delete-target',
      },
      {
        amount: 20,
        createdAtIso: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3))
          .toISOString(),
        id: 'history-keep-target',
      },
    ];
    const deletedDateLabel = formatWithdrawalDateForTest(historyEntries[0].createdAtIso);

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, JSON.stringify(historyEntries)],
    ]);

    const {getByTestId, getByText, queryByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByTestId('home-total-amount-value')).toBeTruthy();
      expect(getByText(deletedDateLabel)).toBeTruthy();
    });

    const initialOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );

    pressWithdrawalHistoryRowByDate(getByText, historyEntries[0].createdAtIso);

    await waitFor(() => {
      expect(getByText('Delete')).toBeTruthy();
    });
    pressButtonByLabel(getByText, 'Delete');

    await waitFor(() => {
      expect(getByText('Withdrawal deleted')).toBeTruthy();
      expect(queryByText(deletedDateLabel)).toBeNull();
    });

    const updatedOverallAmount = getAmountFromTextNode(
      getByTestId('home-total-amount-value'),
    );
    expect(updatedOverallAmount).toBe(initialOverallAmount + historyEntries[0].amount);
  });

  it('pauses month progress pulse while withdraw dialog is visible', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {UNSAFE_getByType, getByRole, getByTestId, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(true);
    });

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(false);
    });

    pressButtonByLabel(getByText, 'Cancel');

    await waitFor(() => {
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(true);
    });
  });

  it('pauses month progress pulse while withdrawal details dialog is visible', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const historyEntry = {
      amount: 16,
      createdAtIso: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1))
        .toISOString(),
      id: 'history-entry-pulse-check',
    };

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, JSON.stringify([historyEntry])],
    ]);

    const {UNSAFE_getByType, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByText(formatWithdrawalDateForTest(historyEntry.createdAtIso))).toBeTruthy();
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(true);
    });

    pressWithdrawalHistoryRowByDate(getByText, historyEntry.createdAtIso);

    await waitFor(() => {
      expect(getByText('Withdrawal details')).toBeTruthy();
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(false);
    });

    pressButtonByLabel(getByText, 'Cancel');

    await waitFor(() => {
      expect(UNSAFE_getByType(AppProgressBar).props.pulseEnabled).toBe(true);
    });
  });

  it('closes withdraw dialog when menu opens', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {getByRole, getByTestId, getByText, queryByText, rerender} =
      renderHomeScreen();

    await waitFor(() => {
      expect(
        getByRole('button', {name: 'Withdraw from total amount'}),
      ).toBeTruthy();
    });

    pressTotalAmountButton(getByTestId);

    await waitFor(() => {
      expect(getByText(/You can withdraw only from past months/)).toBeTruthy();
    });

    rerender(createHomeScreenTree({isMenuVisible: true}));

    await waitFor(() => {
      expect(queryByText(/You can withdraw only from past months/)).toBeNull();
    });
  });

  it('shows and hides withdrawal history footer dim based on scroll position', async () => {
    const now = new Date();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const history = Array.from({length: 14}, (_, index) => ({
      amount: 10 + index,
      createdAtIso: new Date(
        now.getFullYear(),
        now.getMonth(),
        Math.max(1, now.getDate() - index),
      ).toISOString(),
      id: `entry-${index}`,
    }));

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, previousMonthStart.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '10'],
      [STORAGE_KEYS.counterWithdrawalHistory, JSON.stringify(history)],
    ]);

    const {getByTestId, queryByTestId} = renderHomeScreen();

    await waitFor(() => {
      expect(getByTestId('withdrawal-history-scroll')).toBeTruthy();
    });

    const historyScroll = getByTestId('withdrawal-history-scroll');
    fireEvent(historyScroll, 'layout', {
      nativeEvent: {
        layout: {
          height: 120,
          width: 320,
          x: 0,
          y: 0,
        },
      },
    });
    fireEvent(historyScroll, 'contentSizeChange', 320, 400);

    await waitFor(() => {
      expect(queryByTestId('withdrawal-history-footer-dim')).toBeTruthy();
    });

    fireEvent.scroll(historyScroll, {
      nativeEvent: {
        contentOffset: {
          x: 0,
          y: 280,
        },
      },
    });

    await waitFor(() => {
      expect(queryByTestId('withdrawal-history-footer-dim')).toBeNull();
    });
  });
});
