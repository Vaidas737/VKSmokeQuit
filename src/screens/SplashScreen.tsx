import {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {AppText} from '@/components/AppText';
import {withOpacity} from '@/design/theme';
import {useTheme} from '@/design/theme/ThemeProvider';

const HEARTBEAT_MS = 1400;
const FLOAT_LOOP_MS = 1900;

export function SplashScreen() {
  const {theme} = useTheme();
  const heartbeatProgress = useRef(new Animated.Value(0)).current;
  const floatProgress = useRef(new Animated.Value(0)).current;
  const heartbeatAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const floatAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState<boolean | null>(
    null,
  );
  const shouldAnimate = isReduceMotionEnabled === false;
  const mascotSize = theme.spacing[48] + theme.spacing[48] + theme.spacing[24];
  const mascotInnerSize = mascotSize - theme.spacing[16] - theme.spacing[16];
  const pulseRingSize = mascotSize + theme.spacing[16];
  const iconSize = theme.spacing[32] + theme.spacing[8];
  const sparkleIconSize = theme.spacing[16];
  const sparkleShift = theme.spacing[24];
  const sparkleStartY = theme.spacing[16];
  const sparkleEndY = -theme.spacing[40];
  const sparkleLift = theme.spacing[12];
  const sparkleHalf = sparkleIconSize / 2;
  const mascotFillColor = useMemo(
    () =>
      withOpacity(
        theme.colors.primary,
        theme.state.focusOpacity + theme.state.pressedOpacity,
      ),
    [theme.colors.primary, theme.state.focusOpacity, theme.state.pressedOpacity],
  );

  const heartbeatScale = heartbeatProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 1.08, 1],
  });
  const heartbeatTilt = heartbeatProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-2deg', '2deg', '-2deg'],
  });
  const ringScale = heartbeatProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.98, 1.09, 0.98],
  });
  const ringOpacity = heartbeatProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.14, 0.36, 0.14],
  });

  const leftSparkleY = floatProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [sparkleStartY, sparkleEndY],
  });
  const leftSparkleOpacity = floatProgress.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 0.92, 0.58, 0],
  });
  const leftSparkleScale = floatProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.68, 1, 0.76],
  });

  const rightSparkleY = floatProgress.interpolate({
    inputRange: [0, 0.22, 1],
    outputRange: [sparkleStartY, sparkleStartY, sparkleEndY + sparkleLift],
  });
  const rightSparkleOpacity = floatProgress.interpolate({
    inputRange: [0, 0.22, 0.48, 1],
    outputRange: [0, 0, 0.86, 0],
  });
  const rightSparkleScale = floatProgress.interpolate({
    inputRange: [0, 0.22, 0.5, 1],
    outputRange: [0.62, 0.62, 1, 0.72],
  });

  useEffect(() => {
    let isMounted = true;
    const handleReduceMotionChange = (enabled: boolean) => {
      setIsReduceMotionEnabled(enabled);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (isMounted) {
          setIsReduceMotionEnabled(enabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsReduceMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChange,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    heartbeatAnimationRef.current?.stop();
    floatAnimationRef.current?.stop();
    heartbeatAnimationRef.current = null;
    floatAnimationRef.current = null;
    heartbeatProgress.setValue(0);
    floatProgress.setValue(0);

    if (!shouldAnimate) {
      return;
    }

    const nextHeartbeatAnimation = Animated.loop(
      Animated.timing(heartbeatProgress, {
        duration: HEARTBEAT_MS,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    const nextFloatAnimation = Animated.loop(
      Animated.timing(floatProgress, {
        duration: FLOAT_LOOP_MS,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    heartbeatAnimationRef.current = nextHeartbeatAnimation;
    floatAnimationRef.current = nextFloatAnimation;
    nextHeartbeatAnimation.start();
    nextFloatAnimation.start();

    return () => {
      heartbeatAnimationRef.current?.stop();
      floatAnimationRef.current?.stop();
      heartbeatAnimationRef.current = null;
      floatAnimationRef.current = null;
    };
  }, [floatProgress, heartbeatProgress, shouldAnimate]);

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.safeArea, {backgroundColor: theme.colors.background}]}
      testID="app-splash-screen">
      <View style={[styles.content, {paddingHorizontal: theme.spacing[24]}]}>
        <View
          style={[
            styles.mascotArea,
            {
              marginBottom: theme.spacing[4],
              height: pulseRingSize + theme.spacing[12],
              width: pulseRingSize + theme.spacing[12],
            },
          ]}>
          {shouldAnimate ? (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: withOpacity(theme.colors.primary, 0.5),
                  borderRadius: pulseRingSize / 2,
                  borderWidth: theme.spacing[4] / 2,
                  height: pulseRingSize,
                  opacity: ringOpacity,
                  transform: [{scale: ringScale}],
                  width: pulseRingSize,
                },
              ]}
            />
          ) : null}

          {shouldAnimate ? (
            <>
              <Animated.View
                style={[
                  styles.sparkle,
                  {
                    opacity: leftSparkleOpacity,
                    transform: [
                      {translateX: -sparkleHalf - sparkleShift},
                      {translateY: leftSparkleY},
                      {scale: leftSparkleScale},
                    ],
                  },
                ]}>
                <MaterialIcons
                  color={theme.colors.secondary}
                  name="spa"
                  size={sparkleIconSize}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  {
                    opacity: rightSparkleOpacity,
                    transform: [
                      {translateX: -sparkleHalf + sparkleShift},
                      {translateY: rightSparkleY},
                      {scale: rightSparkleScale},
                    ],
                  },
                ]}>
                <MaterialIcons
                  color={theme.colors.tertiary}
                  name="spa"
                  size={sparkleIconSize}
                />
              </Animated.View>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.sparkle,
                  styles.sparkleStatic,
                  {
                    transform: [{translateX: -sparkleHalf - sparkleShift}],
                  },
                ]}>
                <MaterialIcons
                  color={theme.colors.secondary}
                  name="spa"
                  size={sparkleIconSize}
                />
              </View>
              <View
                style={[
                  styles.sparkle,
                  styles.sparkleStatic,
                  {
                    transform: [{translateX: -sparkleHalf + sparkleShift}],
                  },
                ]}>
                <MaterialIcons
                  color={theme.colors.tertiary}
                  name="spa"
                  size={sparkleIconSize}
                />
              </View>
            </>
          )}

          <Animated.View
            style={[
              styles.mascot,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                borderRadius: mascotSize / 2,
                borderWidth: theme.spacing[4] / 4,
                height: mascotSize,
                transform: shouldAnimate
                  ? [{scale: heartbeatScale}, {rotate: heartbeatTilt}]
                  : undefined,
                width: mascotSize,
              },
              theme.elevation.level1,
            ]}>
            <View
              style={[
                styles.mascotInner,
                {
                  backgroundColor: mascotFillColor,
                  borderRadius: mascotInnerSize / 2,
                  height: mascotInnerSize,
                  width: mascotInnerSize,
                },
              ]}>
              <MaterialIcons
                color={theme.colors.primary}
                name="smoke-free"
                size={iconSize}
              />
            </View>
          </Animated.View>
        </View>

        <View style={[styles.textBlock, {gap: theme.spacing[8]}]}>
          <AppText style={styles.centerText} variant="headlineSmall">
            Smoke Free Start
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerText: {
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mascot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  safeArea: {
    flex: 1,
  },
  sparkle: {
    left: '50%',
    position: 'absolute',
    top: '50%',
  },
  sparkleStatic: {
    opacity: 0.68,
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
  },
});
