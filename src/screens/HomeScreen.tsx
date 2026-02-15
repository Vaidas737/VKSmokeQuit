import {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {AppState, StyleSheet, View} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppProgressBar} from '@/components/AppProgressBar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {
  calculateMonthRemainingProgress,
  calculateCounterTotals,
  DEFAULT_DAILY_AMOUNT,
  getStoredCounterSettings,
  startOfLocalDay,
} from '@/utils/counterStorage';

export function HomeScreen() {
  const {theme} = useTheme();
  const isFocused = useIsFocused();
  const [now, setNow] = useState<Date>(() => new Date());
  const [startDate, setStartDate] = useState<Date>(() => startOfLocalDay(new Date()));
  const [dailyAmount, setDailyAmount] = useState<number>(DEFAULT_DAILY_AMOUNT);

  const hydrateCounterSettings = useCallback(async () => {
    const storedCounterSettings = await getStoredCounterSettings();
    setStartDate(storedCounterSettings.startDate);
    setDailyAmount(storedCounterSettings.dailyAmount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getStoredCounterSettings()
        .then(storedCounterSettings => {
          if (isActive) {
            setStartDate(storedCounterSettings.startDate);
            setDailyAmount(storedCounterSettings.dailyAmount);
          }
        })
        .catch(() => {
          if (isActive) {
            setStartDate(startOfLocalDay(new Date()));
            setDailyAmount(DEFAULT_DAILY_AMOUNT);
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
        hydrateCounterSettings().catch(() => {});
      }
    });

    return () => {
      clearInterval(tickInterval);
      appStateSubscription.remove();
    };
  }, [hydrateCounterSettings]);

  const totals = useMemo(
    () => calculateCounterTotals(startDate, dailyAmount, now),
    [dailyAmount, now, startDate],
  );
  const monthRemaining = useMemo(() => calculateMonthRemainingProgress(now), [now]);
  const monthRemainingPercent = Math.round(monthRemaining.remainingRatio * 100);
  const daysLabel = monthRemaining.daysLeft === 1 ? 'day' : 'days';

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={[styles.summary, {marginBottom: theme.spacing[24]}]}>
          <View style={styles.summaryRow}>
            <AppText color="primary" style={styles.summaryValue} variant="displaySmall">
              ₪{totals.overall}
            </AppText>
          </View>
        </View>
        <AppCard>
          <AppText variant="titleLarge">
            This Month: ₪{totals.monthly}
          </AppText>
          <AppText
            color="onSurfaceVariant"
            style={{marginTop: theme.spacing[8]}}
            variant="bodySmall">
            Month Remaining: {monthRemainingPercent}%
          </AppText>
          <AppProgressBar
            accessibilityLabel="Month remaining progress"
            pulseEnabled={isFocused}
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
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
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
});
