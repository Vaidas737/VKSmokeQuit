import {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {AppButton} from '@/components/AppButton';
import {AppCard} from '@/components/AppCard';
import {AppSnackbar} from '@/components/AppSnackbar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {
  DEFAULT_DAILY_AMOUNT,
  formatDateYmd,
  getStoredCounterSettings,
  resetCounterStartDate,
  saveCounterDailyAmount,
  startOfLocalDay,
} from '@/utils/counterStorage';

const COUNTER_AMOUNT_ERROR_TEXT = 'Enter a non-negative whole number.';

export function CounterScreen() {
  const {theme} = useTheme();
  const [startDate, setStartDate] = useState<Date>(() => startOfLocalDay(new Date()));
  const [amountInputValue, setAmountInputValue] = useState<string>(
    String(DEFAULT_DAILY_AMOUNT),
  );
  const [amountError, setAmountError] = useState<string | undefined>();
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  useEffect(() => {
    let isMounted = true;

    getStoredCounterSettings()
      .then(storedCounterSettings => {
        if (isMounted) {
          setStartDate(storedCounterSettings.startDate);
          setAmountInputValue(String(storedCounterSettings.dailyAmount));
          setAmountError(undefined);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStartDate(startOfLocalDay(new Date()));
          setAmountInputValue(String(DEFAULT_DAILY_AMOUNT));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const parsedAmount = useMemo(() => Number(amountInputValue), [amountInputValue]);
  const isValidAmount =
    amountInputValue.trim().length > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 0 &&
    Number.isInteger(parsedAmount);

  const resetDateCounter = () => {
    resetCounterStartDate()
      .then(nextDate => {
        setStartDate(nextDate);
        showSnackbar('Counter date reset to today');
      })
      .catch(() => {
        showSnackbar('Unable to reset counter date');
      });
  };

  const saveCounterAmount = () => {
    if (!isValidAmount) {
      setAmountError(COUNTER_AMOUNT_ERROR_TEXT);
      return;
    }

    saveCounterDailyAmount(parsedAmount)
      .then(savedAmount => {
        setAmountInputValue(String(savedAmount));
        setAmountError(undefined);
        showSnackbar('Counter amount saved');
      })
      .catch(() => {
        showSnackbar('Unable to save counter amount');
      });
  };

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={[styles.content, {gap: theme.spacing[16]}]}>
          <AppCard>
            <AppText variant="titleMedium">Date Counter</AppText>
            <AppText color="onSurfaceVariant" style={{marginTop: theme.spacing[8]}}>
              Start Date: {formatDateYmd(startDate)}
            </AppText>

            <View style={{marginTop: theme.spacing[12]}}>
              <AppButton onPress={resetDateCounter} variant="tertiary">
                Reset Date Counter
              </AppButton>
            </View>
          </AppCard>

          <AppCard>
            <AppText variant="titleMedium">Counter Amount</AppText>
            <AppText color="onSurfaceVariant" style={{marginTop: theme.spacing[8]}}>
              Set the daily amount in ILS.
            </AppText>

            <View
              style={{marginTop: theme.spacing[12]}}>
              <AppText
                color={amountError ? 'error' : 'onSurfaceVariant'}
                style={styles.amountLabel}
                variant="labelLarge">
                Amount (ILS/day)
              </AppText>
              <View
                style={[
                  styles.amountInputContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: amountError ? theme.colors.error : theme.colors.outline,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing[12],
                  },
                ]}
                >
                <TextInput
                  autoCorrect={false}
                  blurOnSubmit
                  keyboardType="numbers-and-punctuation"
                  onChangeText={nextValue => {
                    setAmountInputValue(nextValue);
                    if (amountError) {
                      setAmountError(undefined);
                    }
                  }}
                onSubmitEditing={saveCounterAmount}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                returnKeyType="done"
                selection={{
                  end: amountInputValue.length,
                  start: amountInputValue.length,
                }}
                selectionColor={theme.colors.primary}
                spellCheck={false}
                style={[
                  theme.typography.bodyLarge,
                  styles.amountInput,
                  styles.amountInputTypographyOverride,
                  styles.amountInputDirection,
                  styles.amountInputNudge,
                  {color: theme.colors.onSurface},
                ]}
                value={amountInputValue}
              />
              </View>

              {amountError ? (
                <AppText color="error" style={styles.amountError} variant="labelMedium">
                  {amountError}
                </AppText>
              ) : null}
            </View>

            <View style={{marginTop: theme.spacing[12]}}>
              <AppButton onPress={saveCounterAmount} variant="primary">
                Save Counter Amount
              </AppButton>
            </View>
          </AppCard>
        </View>
      </TouchableWithoutFeedback>

      <AppSnackbar
        actionLabel="Dismiss"
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
        visible={isSnackbarVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  amountError: {
    marginTop: 6,
  },
  amountInput: {
    flex: 1,
    marginVertical: 0,
    paddingBottom: 0,
    paddingTop: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  amountInputDirection: {
    writingDirection: 'ltr',
  },
  amountInputTypographyOverride: {
    lineHeight: 20,
  },
  amountInputNudge: {
    position: 'relative',
    top: Platform.OS === 'ios' ? -1 : 0,
  },
  amountInputContainer: {
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
  },
  amountLabel: {
    marginBottom: 6,
  },
});
