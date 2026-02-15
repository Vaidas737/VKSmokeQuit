import {useEffect, useMemo, useState} from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
import {AppDialog} from '@/components/AppDialog';
import {AppSnackbar, type AppSnackbarTone} from '@/components/AppSnackbar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {
  DEFAULT_DAILY_AMOUNT,
  formatDateYmd,
  getStoredCounterSettings,
  resetCounterStartDate,
  saveCounterStartDate,
  saveCounterDailyAmount,
  startOfLocalDay,
} from '@/utils/counterStorage';

const COUNTER_AMOUNT_ERROR_TEXT = 'Enter a non-negative whole number.';

type SnackbarState = {
  eventId: number;
  message: string;
  tone: AppSnackbarTone;
  visible: boolean;
};

export function CounterScreen() {
  const {theme} = useTheme();
  const [startDate, setStartDate] = useState<Date>(() => startOfLocalDay(new Date()));
  const [draftStartDate, setDraftStartDate] = useState<Date>(() =>
    startOfLocalDay(new Date()),
  );
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [amountInputValue, setAmountInputValue] = useState<string>(
    String(DEFAULT_DAILY_AMOUNT),
  );
  const [amountError, setAmountError] = useState<string | undefined>();
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

  useEffect(() => {
    let isMounted = true;

    getStoredCounterSettings()
      .then(storedCounterSettings => {
        if (isMounted) {
          setStartDate(storedCounterSettings.startDate);
          setDraftStartDate(storedCounterSettings.startDate);
          setAmountInputValue(String(storedCounterSettings.dailyAmount));
          setAmountError(undefined);
        }
      })
      .catch(() => {
        if (isMounted) {
          const today = startOfLocalDay(new Date());
          setStartDate(today);
          setDraftStartDate(today);
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
        setDraftStartDate(nextDate);
        showSnackbar('Counter date reset to today', 'success');
      })
      .catch(() => {
        showSnackbar('Unable to reset counter date', 'error');
      });
  };

  const openStartDatePicker = () => {
    setDraftStartDate(startDate);
    setStartDatePickerVisible(true);
  };

  const handleStartDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (!selectedDate) {
      return;
    }

    setDraftStartDate(startOfLocalDay(selectedDate));
  };

  const saveStartDate = () => {
    saveCounterStartDate(draftStartDate)
      .then(savedDate => {
        setStartDate(savedDate);
        setDraftStartDate(savedDate);
        setStartDatePickerVisible(false);
        showSnackbar(`Start date saved: ${formatDateYmd(savedDate)}`, 'success');
      })
      .catch(() => {
        showSnackbar('Unable to save start date', 'error');
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
        showSnackbar(`Counter amount saved: ${savedAmount} ILS/day`, 'success');
      })
      .catch(() => {
        showSnackbar('Unable to save counter amount', 'error');
      });
  };

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={[styles.content, {gap: theme.spacing[16]}]}>
          <AppCard>
            <View style={[styles.dateCounterContent, {gap: theme.spacing[8]}]}>
              <AppText variant="titleMedium">Date Counter</AppText>
              <AppText color="onSurfaceVariant">
                Start Date: {formatDateYmd(startDate)}
              </AppText>
              <View style={{marginTop: theme.spacing[4]}}>
                <AppButton fullWidth onPress={openStartDatePicker} variant="primary">
                  Choose Start Date
                </AppButton>
              </View>
              <View style={{marginTop: theme.spacing[4]}}>
                <AppButton fullWidth onPress={resetDateCounter} variant="tertiary">
                  Reset Date Counter
                </AppButton>
              </View>
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

          </AppCard>
        </View>
      </TouchableWithoutFeedback>

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
        confirmLabel="Save Start Date"
        onCancel={() => {
          setDraftStartDate(startDate);
          setStartDatePickerVisible(false);
        }}
        onConfirm={saveStartDate}
        onDismiss={() => {
          setDraftStartDate(startDate);
          setStartDatePickerVisible(false);
        }}
        title="Choose Start Date"
        visible={isStartDatePickerVisible}>
        <DateTimePicker
          accentColor={theme.colors.primary}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode="date"
          onChange={handleStartDateChange}
          textColor={theme.colors.onSurface}
          themeVariant={theme.isDark ? 'dark' : 'light'}
          value={draftStartDate}
        />
      </AppDialog>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  dateCounterContent: {
    alignItems: 'stretch',
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
