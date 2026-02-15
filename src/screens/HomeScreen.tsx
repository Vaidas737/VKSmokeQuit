import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {
  AppState,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppDialog} from '@/components/AppDialog';
import {AppListRow} from '@/components/AppListRow';
import {AppProgressBar} from '@/components/AppProgressBar';
import {AppSnackbar, type AppSnackbarTone} from '@/components/AppSnackbar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';
import {
  calculateMonthRemainingProgress,
  calculateWithdrawalBalances,
  type CounterWithdrawalEntry,
  deleteCounterWithdrawal,
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
  const [selectedWithdrawalEntry, setSelectedWithdrawalEntry] =
    useState<CounterWithdrawalEntry | null>(null);
  const [isHistoryFooterDimVisible, setHistoryFooterDimVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    eventId: 0,
    message: '',
    tone: 'info',
    visible: false,
  });
  const withdrawalHistoryMetricsRef = useRef({
    contentHeight: 0,
    offsetY: 0,
    viewportHeight: 0,
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
  const closeWithdrawalDetailsDialog = useCallback(() => {
    setSelectedWithdrawalEntry(null);
  }, []);
  const isWithdrawalDetailsDialogVisible = selectedWithdrawalEntry !== null;

  useEffect(() => {
    if (!isMenuVisible) {
      return;
    }

    if (isWithdrawDialogVisible) {
      closeWithdrawDialog();
    }

    if (isWithdrawalDetailsDialogVisible) {
      closeWithdrawalDetailsDialog();
    }
  }, [
    closeWithdrawDialog,
    closeWithdrawalDetailsDialog,
    isMenuVisible,
    isWithdrawalDetailsDialogVisible,
    isWithdrawDialogVisible,
  ]);

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
  const isMonthRemainingPulseEnabled =
    isFocused && !isWithdrawDialogVisible && !isWithdrawalDetailsDialogVisible;
  const withdrawalError = useMemo(
    () =>
      getWithdrawalInputError(
        withdrawAmountInput,
        balances.pastAccumulatedAvailable,
      ),
    [balances.pastAccumulatedAvailable, withdrawAmountInput],
  );
  const canOpenWithdrawDialog = balances.pastAccumulatedAvailable > 0;
  const isWithdrawalInputValid =
    withdrawAmountInput.trim().length > 0 && !withdrawalError;

  const openWithdrawDialog = () => {
    if (!canOpenWithdrawDialog) {
      return;
    }

    setWithdrawDialogVisible(true);
  };

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
  const confirmWithdrawalDeletion = () => {
    if (!selectedWithdrawalEntry) {
      return;
    }

    deleteCounterWithdrawal(selectedWithdrawalEntry.id)
      .then(updatedHistory => {
        setWithdrawHistory(updatedHistory);
        closeWithdrawalDetailsDialog();
        showSnackbar('Withdrawal deleted', 'success');
      })
      .catch(() => {
        closeWithdrawalDetailsDialog();
        showSnackbar('Unable to delete withdrawal', 'error');
      });
  };

  const updateHistoryFooterDimVisibility = useCallback(() => {
    const {contentHeight, offsetY, viewportHeight} = withdrawalHistoryMetricsRef.current;
    const scrollableRange = contentHeight - viewportHeight;
    const canScrollDown = scrollableRange > 1 && offsetY < scrollableRange - 1;

    setHistoryFooterDimVisible(previous => (
      previous === canScrollDown ? previous : canScrollDown
    ));
  }, []);

  const handleWithdrawalHistoryLayout = useCallback((height: number) => {
    withdrawalHistoryMetricsRef.current.viewportHeight = height;
    updateHistoryFooterDimVisibility();
  }, [updateHistoryFooterDimVisibility]);

  const handleWithdrawalHistoryContentSizeChange = useCallback((height: number) => {
    withdrawalHistoryMetricsRef.current.contentHeight = height;
    updateHistoryFooterDimVisibility();
  }, [updateHistoryFooterDimVisibility]);

  const handleWithdrawalHistoryScroll = useCallback((offsetY: number) => {
    withdrawalHistoryMetricsRef.current.offsetY = offsetY;
    updateHistoryFooterDimVisibility();
  }, [updateHistoryFooterDimVisibility]);
  const withdrawalHistoryFooterDimStops = useMemo(() => {
    const stopCount = 16;
    const peakOpacity = Math.min(
      0.92,
      theme.state.scrimOpacity +
        theme.state.disabledContainerOpacity +
        theme.state.focusOpacity,
    );

    return Array.from({length: stopCount}, (_, index) => {
      const normalized = index / (stopCount - 1);
      const opacity = normalized ** 1.15 * peakOpacity;

      return withOpacity(theme.colors.surface, opacity);
    });
  }, [
    theme.colors.surface,
    theme.state.disabledContainerOpacity,
    theme.state.focusOpacity,
    theme.state.scrimOpacity,
  ]);

  return (
    <ScreenContainer>
      <View
        style={[
          styles.content,
          styles.mainContent,
          {
            gap: theme.spacing[16],
            paddingBottom: theme.spacing[24],
          },
        ]}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Pressable
              accessibilityLabel="Withdraw from total amount"
              accessibilityRole="button"
              accessibilityState={{disabled: !canOpenWithdrawDialog}}
              disabled={!canOpenWithdrawDialog}
              hitSlop={4}
              onPress={openWithdrawDialog}
              testID="home-total-amount-button"
              style={({pressed}) => [
                styles.summaryValuePressable,
                pressed && canOpenWithdrawDialog ? styles.summaryValuePressablePressed : null,
              ]}>
              <AppText color="secondary" style={styles.summaryValue} variant="displaySmall">
                ₪{balances.adjustedOverall}
              </AppText>
            </Pressable>
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

        <AppCard style={styles.withdrawalHistoryCard}>
          <AppText variant="titleMedium">Withdrawal History</AppText>
          <View style={[styles.withdrawalHistoryBody, {marginTop: theme.spacing[8]}]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={(_, contentHeight) =>
                handleWithdrawalHistoryContentSizeChange(contentHeight)
              }
              onLayout={event => handleWithdrawalHistoryLayout(event.nativeEvent.layout.height)}
              onScroll={event =>
                handleWithdrawalHistoryScroll(event.nativeEvent.contentOffset.y)
              }
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={withdrawHistory.length > 0}
              style={styles.withdrawalHistoryScroll}
              testID="withdrawal-history-scroll">
              {withdrawHistory.length === 0 ? (
                <AppText color="onSurfaceVariant" variant="bodyMedium">
                  No withdrawals yet.
                </AppText>
              ) : (
                withdrawHistory.map(entry => (
                  <AppListRow
                    animateOnPress
                    key={entry.id}
                    onPress={() => setSelectedWithdrawalEntry(entry)}
                    subtitle={formatWithdrawalDate(entry.createdAtIso)}
                    title={`₪${entry.amount}`}
                  />
                ))
              )}
            </ScrollView>
            {isHistoryFooterDimVisible ? (
              <View
                pointerEvents="none"
                style={[
                  styles.withdrawalHistoryFooterDim,
                  {
                    height: theme.spacing[40],
                  },
                ]}
                testID="withdrawal-history-footer-dim"
              >
                {withdrawalHistoryFooterDimStops.map((stopColor, index) => (
                  <View
                    key={`withdrawal-history-footer-dim-stop-${index}`}
                    style={[styles.withdrawalHistoryFooterDimStop, {backgroundColor: stopColor}]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </AppCard>
      </View>

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

      <AppDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onCancel={closeWithdrawalDetailsDialog}
        onConfirm={confirmWithdrawalDeletion}
        onDismiss={closeWithdrawalDetailsDialog}
        title="Withdrawal details"
        visible={isWithdrawalDetailsDialogVisible}>
        {selectedWithdrawalEntry ? (
          <View style={{gap: theme.spacing[12]}}>
            <AppText color="onSurfaceVariant" variant="bodyMedium">
              Amount: ₪{selectedWithdrawalEntry.amount}
            </AppText>
            <AppText color="onSurfaceVariant" variant="bodyMedium">
              Date: {formatWithdrawalDate(selectedWithdrawalEntry.createdAtIso)}
            </AppText>
          </View>
        ) : null}
      </AppDialog>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'flex-start',
  },
  mainContent: {
    flex: 1,
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
  summaryValuePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  summaryValuePressablePressed: {
    opacity: 0.9,
  },
  summaryValue: {
    textAlign: 'center',
  },
  withdrawalHistoryBody: {
    flex: 1,
    position: 'relative',
  },
  withdrawalHistoryCard: {
    flex: 1,
  },
  withdrawalHistoryFooterDim: {
    bottom: 0,
    flexDirection: 'column',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  withdrawalHistoryFooterDimStop: {
    flex: 1,
  },
  withdrawalHistoryScroll: {
    flex: 1,
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
