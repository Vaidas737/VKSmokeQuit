import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {TextInput} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {STORAGE_KEYS} from '@/constants/storage';
import {ThemeProvider} from '@/design/theme/ThemeProvider';
import {HomeScreen} from '@/screens/HomeScreen';
import {calculateWithdrawalBalances, startOfLocalDay} from '@/utils/counterStorage';

const renderHomeScreen = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>,
  );

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

describe('HomeScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps withdraw button disabled when only current month total exists', async () => {
    const today = startOfLocalDay(new Date());
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.counterStartDate, today.toISOString()],
      [STORAGE_KEYS.counterDailyAmount, '45'],
      [STORAGE_KEYS.counterWithdrawalHistory, '[]'],
    ]);

    const {getByRole, queryByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByRole('button', {name: 'Withdraw'})).toBeTruthy();
    });

    const withdrawButton = getByRole('button', {name: 'Withdraw'});
    expect(getButtonDisabledState(withdrawButton)).toBe(true);

    fireEvent.press(withdrawButton);

    expect(queryByText(/You can withdraw only from past months/)).toBeNull();
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

    const {UNSAFE_getByType, getByRole, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByRole('button', {name: 'Withdraw'})).toBeTruthy();
    });

    const withdrawButton = getByRole('button', {name: 'Withdraw'});
    expect(getButtonDisabledState(withdrawButton)).toBe(false);

    pressButtonByLabel(getByText, 'Withdraw');

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

    const {UNSAFE_getByType, getAllByText, getByRole, getByText} = renderHomeScreen();

    await waitFor(() => {
      expect(getByRole('button', {name: 'Withdraw'})).toBeTruthy();
      expect(getAllByText(/^₪\d+$/)[0]).toBeTruthy();
    });

    const initialOverallAmount = getAmountFromTextNode(getAllByText(/^₪\d+$/)[0]);

    pressButtonByLabel(getByText, 'Withdraw');

    await waitFor(() => {
      expect(getByText('Confirm')).toBeTruthy();
    });

    fireEvent.changeText(UNSAFE_getByType(TextInput), '50');

    pressButtonByLabel(getByText, 'Confirm');

    await waitFor(() => {
      expect(getByText('Withdrawal successful: ₪50')).toBeTruthy();
      expect(getByText('₪50')).toBeTruthy();
    });

    const updatedOverallAmount = getAmountFromTextNode(getAllByText(/^₪\d+$/)[0]);
    expect(updatedOverallAmount).toBe(initialOverallAmount - 50);
  });
});
