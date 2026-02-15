import {useEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppNavigator} from '@/navigation/AppNavigator';
import {ThemeProvider, useTheme} from '@/design/theme/ThemeProvider';
import {getNavigationTheme} from '@/design/theme';
import {
  calculateMonthRemainingProgress,
  calculateWithdrawalBalances,
  DEFAULT_DAILY_AMOUNT,
  getStoredCounterSettings,
  getStoredCounterWithdrawalHistory,
  startOfLocalDay,
} from '@/utils/counterStorage';
import type {HomeScreenInitialData} from '@/screens/HomeScreen';
import {SplashScreen} from '@/screens/SplashScreen';

const SPLASH_DURATION_MS = 3000;
const SPLASH_EXIT_ANIMATION_MS = 320;

function AppShell() {
  const {isReady, resolvedMode, theme} = useTheme();
  const [isSplashTimerComplete, setSplashTimerComplete] = useState(false);
  const [isSplashMounted, setSplashMounted] = useState(true);
  const [initialHomeData, setInitialHomeData] = useState<HomeScreenInitialData | undefined>(
    undefined,
  );
  const splashExitStartedRef = useRef(false);
  const splashExitOpacity = useRef(new Animated.Value(1)).current;
  const navigationTheme = getNavigationTheme(theme);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const splashTimeout = setTimeout(() => {
      setSplashTimerComplete(true);
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(splashTimeout);
    };
  }, [isReady]);

  useEffect(() => {
    let isMounted = true;

    const preloadHomeData = async () => {
      try {
        const now = new Date();
        const [storedCounterSettings, storedWithdrawals] = await Promise.all([
          getStoredCounterSettings(),
          getStoredCounterWithdrawalHistory(),
        ]);
        const preparedBalances = calculateWithdrawalBalances(
          storedCounterSettings.startDate,
          storedCounterSettings.dailyAmount,
          now,
          storedWithdrawals,
        );
        const preparedMonthRemaining = calculateMonthRemainingProgress(now);

        if (isMounted) {
          setInitialHomeData({
            dailyAmount: storedCounterSettings.dailyAmount,
            now,
            preparedBalances,
            preparedMonthRemaining,
            startDate: storedCounterSettings.startDate,
            withdrawHistory: storedWithdrawals,
          });
        }
      } catch {
        if (!isMounted) {
          return;
        }

        const now = new Date();
        const startDate = startOfLocalDay(now);
        const withdrawHistory = [];
        const preparedBalances = calculateWithdrawalBalances(
          startDate,
          DEFAULT_DAILY_AMOUNT,
          now,
          withdrawHistory,
        );
        const preparedMonthRemaining = calculateMonthRemainingProgress(now);

        setInitialHomeData({
          dailyAmount: DEFAULT_DAILY_AMOUNT,
          now,
          preparedBalances,
          preparedMonthRemaining,
          startDate,
          withdrawHistory,
        });
      }
    };

    preloadHomeData().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isSplashMounted || splashExitStartedRef.current) {
      return;
    }

    if (!isSplashTimerComplete || !initialHomeData) {
      return;
    }

    splashExitStartedRef.current = true;

    Animated.parallel([
      Animated.timing(splashExitOpacity, {
        duration: SPLASH_EXIT_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start(({finished}) => {
      if (!finished) {
        splashExitStartedRef.current = false;
        return;
      }

      setSplashMounted(false);
    });
  }, [
    initialHomeData,
    isReady,
    isSplashMounted,
    isSplashTimerComplete,
    splashExitOpacity,
  ]);

  if (!isReady) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {backgroundColor: theme.colors.background},
        ]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={resolvedMode === 'dark' ? 'light-content' : 'dark-content'} />
      {initialHomeData ? (
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator initialHomeData={initialHomeData} />
        </NavigationContainer>
      ) : null}
      {isSplashMounted ? (
        <Animated.View
          style={[
            styles.splashOverlay,
            {
              backgroundColor: theme.colors.background,
              opacity: splashExitOpacity,
            },
          ]}>
          <SplashScreen />
        </Animated.View>
      ) : null}
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});

export default App;
