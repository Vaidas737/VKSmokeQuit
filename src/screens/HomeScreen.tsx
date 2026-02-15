import {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {
  AppState,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {AppButton} from '@/components/AppButton';
import {AppCard} from '@/components/AppCard';
import {AppDialog} from '@/components/AppDialog';
import {AppListRow} from '@/components/AppListRow';
import {AppProgressBar} from '@/components/AppProgressBar';
import {AppSnackbar, type AppSnackbarTone} from '@/components/AppSnackbar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {
  calculateMonthRemainingProgress,
  calculateWithdrawalBalances,
  type CounterWithdrawalEntry,
  DEFAULT_DAILY_AMOUNT,
  getStoredCounterSettings,
  getStoredCounterWithdrawalHistory,
  saveCounterWithdrawal,
  startOfLocalDay,
} from '@/utils/counterStorage';

type SnackbarState = {
  eventId: number;
  message: string;
  tone: AppSnackbarTone;
  visible: boolean;
};

const getWithdrawalInputError = (
  inputValue: string,
  maxAmount: number,
): string | undefined => {
  const trimmed = inputValue.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > maxAmount
  ) {
    return `Enter a whole number from 1 to ₪${maxAmount}.`;
  }

  return undefined;
};

const formatWithdrawalDate = (createdAtIso: string): string => {
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

type HomeScreenProps = {
  isMenuVisible?: boolean;
};

export function HomeScreen({isMenuVisible = false}: HomeScreenProps) {
  const {theme} = useTheme();
  const isFocused = useIsFocused();
  const [now, setNow] = useState<Date>(() => new Date());
  const [startDate, setStartDate] = useState<Date>(() => startOfLocalDay(new Date()));
  const [dailyAmount, setDailyAmount] = useState<number>(DEFAULT_DAILY_AMOUNT);
  const [withdrawHistory, setWithdrawHistory] = useState<CounterWithdrawalEntry[]>([]);
  const [isWithdrawDialogVisible, setWithdrawDialogVisible] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    eventId: 0,
    message: '',
    tone: 'info',
    visible: false,
  });

  const showSnackbar = (message: string, tone: AppSnackbarTone) => {
    setSnackbar(previous => ({
      eventId: previous.eventId + 1,
      message,
      tone,
      visible: true,
    }));
  };

  const closeWithdrawDialog = useCallback(() => {
    setWithdrawDialogVisible(false);
    setWithdrawAmountInput('');
  }, []);

  useEffect(() => {
    if (isMenuVisible && isWithdrawDialogVisible) {
      closeWithdrawDialog();
    }
  }, [closeWithdrawDialog, isMenuVisible, isWithdrawDialogVisible]);

  const hydrateHomeData = useCallback(async () => {
    const [storedCounterSettings, storedWithdrawals] = await Promise.all([
      getStoredCounterSettings(),
      getStoredCounterWithdrawalHistory(),
    ]);
    setStartDate(storedCounterSettings.startDate);
    setDailyAmount(storedCounterSettings.dailyAmount);
    setWithdrawHistory(storedWithdrawals);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([getStoredCounterSettings(), getStoredCounterWithdrawalHistory()])
        .then(([storedCounterSettings, storedWithdrawals]) => {
          if (isActive) {
            setStartDate(storedCounterSettings.startDate);
            setDailyAmount(storedCounterSettings.dailyAmount);
            setWithdrawHistory(storedWithdrawals);
          }
        })
        .catch(() => {
          if (isActive) {
            setStartDate(startOfLocalDay(new Date()));
            setDailyAmount(DEFAULT_DAILY_AMOUNT);
            setWithdrawHistory([]);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setNow(new Date());
    }, 30 * 1000);

    const appStateSubscription = AppState.addEventListener('change', appState => {
      if (appState === 'active') {
        setNow(new Date());
        hydrateHomeData().catch(() => {});
      }
    });

    return () => {
      clearInterval(tickInterval);
      appStateSubscription.remove();
    };
  }, [hydrateHomeData]);

  const balances = useMemo(
    () => calculateWithdrawalBalances(startDate, dailyAmount, now, withdrawHistory),
    [dailyAmount, now, startDate, withdrawHistory],
  );
  const monthRemaining = useMemo(() => calculateMonthRemainingProgress(now), [now]);
  const monthRemainingPercent = Math.round(monthRemaining.remainingRatio * 100);
  const daysLabel = monthRemaining.daysLeft === 1 ? 'day' : 'days';
  const isMonthRemainingPulseEnabled = isFocused && !isWithdrawDialogVisible;
  const withdrawalError = useMemo(
    () =>
      getWithdrawalInputError(
        withdrawAmountInput,
        balances.pastAccumulatedAvailable,
      ),
    [balances.pastAccumulatedAvailable, withdrawAmountInput],
  );
  const isWithdrawalInputValid =
    withdrawAmountInput.trim().length > 0 && !withdrawalError;

  const confirmWithdrawal = () => {
    if (!isWithdrawalInputValid) {
      return;
    }

    const parsedAmount = Number(withdrawAmountInput.trim());
    saveCounterWithdrawal(parsedAmount)
      .then(updatedHistory => {
        setWithdrawHistory(updatedHistory);
        closeWithdrawDialog();
        showSnackbar(`Withdrawal successful: ₪${parsedAmount}`, 'success');
      })
      .catch(() => {
        showSnackbar('Unable to save withdrawal', 'error');
      });
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing[24],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.content, {gap: theme.spacing[16]}]}>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <AppText color="primary" style={styles.summaryValue} variant="displaySmall">
                ₪{balances.adjustedOverall}
              </AppText>
            </View>
          </View>

          <AppCard>
            <AppText variant="titleLarge">
              This Month: ₪{balances.generatedMonthly}
            </AppText>
            <AppText
              color="onSurfaceVariant"
              style={{marginTop: theme.spacing[8]}}
              variant="bodySmall">
              Month Remaining: {monthRemainingPercent}%
            </AppText>
            <AppProgressBar
              accessibilityLabel="Month remaining progress"
              pulseEnabled={isMonthRemainingPulseEnabled}
              pulseIntervalMs={2200}
              progress={monthRemaining.remainingRatio}
              style={{marginTop: theme.spacing[8]}}
            />
            <AppText
              color="onSurfaceVariant"
              style={{marginTop: theme.spacing[8]}}
              variant="bodySmall">
              {monthRemaining.daysLeft} {daysLabel} left out of {monthRemaining.daysInMonth}
            </AppText>
          </AppCard>

          <AppButton
            disabled={balances.pastAccumulatedAvailable <= 0}
            onPress={() => setWithdrawDialogVisible(true)}
            variant="secondary">
            Withdraw
          </AppButton>

          <AppCard>
            <AppText variant="titleMedium">Withdrawal History</AppText>
            {withdrawHistory.length === 0 ? (
              <AppText
                color="onSurfaceVariant"
                style={{marginTop: theme.spacing[8]}}
                variant="bodyMedium">
                No withdrawals yet.
              </AppText>
            ) : (
              <View style={{marginTop: theme.spacing[8]}}>
                {withdrawHistory.map(entry => (
                  <AppListRow
                    key={entry.id}
                    subtitle={formatWithdrawalDate(entry.createdAtIso)}
                    title={`₪${entry.amount}`}
                  />
                ))}
              </View>
            )}
          </AppCard>
        </View>
      </ScrollView>

      <AppSnackbar
        actionLabel="Dismiss"
        eventId={snackbar.eventId}
        message={snackbar.message}
        onDismiss={() =>
          setSnackbar(previous => ({
            ...previous,
            visible: false,
          }))
        }
        tone={snackbar.tone}
        visible={snackbar.visible}
      />

      <AppDialog
        cancelLabel="Cancel"
        confirmDisabled={!isWithdrawalInputValid}
        confirmLabel="Confirm"
        onCancel={closeWithdrawDialog}
        onConfirm={confirmWithdrawal}
        onDismiss={closeWithdrawDialog}
        title="Withdraw"
        visible={isWithdrawDialogVisible}>
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View style={{gap: theme.spacing[12]}}>
            <AppText color="onSurfaceVariant" variant="bodyMedium">
              You can withdraw only from past months&apos; accumulated amount. Current month
              amount is excluded. Maximum now: ₪{balances.pastAccumulatedAvailable}.
            </AppText>
            <View>
              <AppText
                color={withdrawalError ? 'error' : 'onSurfaceVariant'}
                style={styles.withdrawInputLabel}
                variant="labelLarge">
                Withdraw amount (ILS)
              </AppText>
              <View
                style={[
                  styles.withdrawInputContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: withdrawalError
                      ? theme.colors.error
                      : theme.colors.outline,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing[12],
                  },
                ]}>
                <TextInput
                  autoCorrect={false}
                  blurOnSubmit
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setWithdrawAmountInput}
                  onSubmitEditing={confirmWithdrawal}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  returnKeyType="done"
                  selection={{
                    end: withdrawAmountInput.length,
                    start: withdrawAmountInput.length,
                  }}
                  selectionColor={theme.colors.primary}
                  spellCheck={false}
                  style={[
                    theme.typography.bodyLarge,
                    styles.withdrawInput,
                    styles.withdrawInputTypographyOverride,
                    styles.withdrawInputDirection,
                    styles.withdrawInputNudge,
                    {color: theme.colors.onSurface},
                  ]}
                  value={withdrawAmountInput}
                />
              </View>
              <View style={styles.withdrawInputErrorSlot}>
                {withdrawalError ? (
                  <AppText
                    color="error"
                    style={styles.withdrawInputError}
                    variant="labelMedium">
                    {withdrawalError}
                  </AppText>
                ) : null}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </AppDialog>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'flex-start',
  },
  summary: {
    width: '100%',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  summaryValue: {
    textAlign: 'center',
  },
  withdrawInput: {
    flex: 1,
    marginVertical: 0,
    paddingBottom: 0,
    paddingTop: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  withdrawInputContainer: {
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
  },
  withdrawInputDirection: {
    writingDirection: 'ltr',
  },
  withdrawInputError: {
    marginTop: 0,
  },
  withdrawInputErrorSlot: {
    marginTop: 6,
    minHeight: 16,
  },
  withdrawInputLabel: {
    marginBottom: 6,
  },
  withdrawInputNudge: {
    position: 'relative',
    top: Platform.OS === 'ios' ? -1 : 0,
  },
  withdrawInputTypographyOverride: {
    lineHeight: 20,
  },
});
