import {useCallback, useEffect, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {AppState, StyleSheet, View} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import {
  calculateCounterTotals,
  DEFAULT_DAILY_AMOUNT,
  formatDateYmd,
  getStoredCounterSettings,
  startOfLocalDay,
} from '@/utils/counterStorage';

export function HomeScreen() {
  const {theme} = useTheme();
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

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppCard>
          <AppText variant="titleLarge">Overall Total: ₪{totals.overall}</AppText>
          <AppText style={{marginTop: theme.spacing[12]}} variant="titleLarge">
            This Month: ₪{totals.monthly}
          </AppText>
          <AppText color="onSurfaceVariant" style={{marginTop: theme.spacing[16]}}>
            Daily Rate: ₪{dailyAmount}/day
          </AppText>
          <AppText color="onSurfaceVariant" style={{marginTop: theme.spacing[8]}}>
            Start Date: {formatDateYmd(startDate)}
          </AppText>
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});
