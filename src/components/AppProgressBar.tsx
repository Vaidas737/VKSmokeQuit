import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import {withOpacity} from '@/design/theme';
import {useTheme} from '@/design/theme/ThemeProvider';
import type {AppColorTokens} from '@/design/tokens/colors';

type AppProgressBarProps = {
  accessibilityLabel?: string;
  color?: keyof AppColorTokens;
  pulseEnabled?: boolean;
  pulseIntervalMs?: number;
  progress: number;
  style?: StyleProp<ViewStyle>;
};

export function AppProgressBar({
  accessibilityLabel,
  color = 'secondary',
  pulseEnabled = true,
  pulseIntervalMs,
  progress,
  style,
}: AppProgressBarProps) {
  const {theme} = useTheme();
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const sweepAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const sweepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialPulseTriggeredRef = useRef(false);
  const layoutStabilizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState<boolean | null>(
    null,
  );
  const [fillWidth, setFillWidth] = useState(0);
  const [isFillLayoutStable, setIsFillLayoutStable] = useState(false);
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressPercent = Math.round(clampedProgress * 100);
  const sweepWidth = useMemo(
    () => Math.max(theme.spacing[32], fillWidth * 0.72),
    [fillWidth, theme.spacing],
  );
  const sweepBaseColor = useMemo(
    () => (theme.isDark ? theme.colors.onSecondary : theme.colors.onPrimary),
    [theme.colors.onPrimary, theme.colors.onSecondary, theme.isDark],
  );
  const sweepGradientStops = useMemo(
    () => {
      const stopCount = 61;
      const edgeOpacity = theme.isDark ? 0.034 : 0.01;
      const peakOpacity = theme.isDark ? 0.74 : 0.55;

      return Array.from({length: stopCount}, (_, index) => {
        const normalized = index / (stopCount - 1);
        const distanceFromCenter = Math.abs(normalized - 0.5) / 0.5;
        const smoothProfile = Math.cos((distanceFromCenter * Math.PI) / 2) ** 2.4;
        const opacity = edgeOpacity + smoothProfile * peakOpacity;

        return withOpacity(sweepBaseColor, opacity);
      });
    },
    [sweepBaseColor, theme.isDark],
  );
  const sweepTranslateX = useMemo(
    () =>
      sweepProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-sweepWidth, fillWidth + sweepWidth],
      }),
    [fillWidth, sweepProgress, sweepWidth],
  );
  const sweepOpacity = useMemo(
    () =>
      sweepProgress.interpolate({
        inputRange: [0, 0.08, 0.22, 0.5, 0.78, 0.92, 1],
        outputRange: theme.isDark
          ? [0, 0.16, 0.54, 0.76, 0.54, 0.16, 0]
          : [0, 0.1, 0.4, 0.66, 0.4, 0.1, 0],
      }),
    [sweepProgress, theme.isDark],
  );
  const shouldAnimatePulse = useMemo(
    () =>
      Boolean(
        pulseIntervalMs &&
          pulseIntervalMs > 0 &&
          pulseEnabled &&
          isReduceMotionEnabled === false &&
          clampedProgress > 0,
      ),
    [clampedProgress, isReduceMotionEnabled, pulseEnabled, pulseIntervalMs],
  );

  const stopPulse = useCallback(() => {
    if (sweepIntervalRef.current) {
      clearInterval(sweepIntervalRef.current);
      sweepIntervalRef.current = null;
    }

    if (layoutStabilizeTimeoutRef.current) {
      clearTimeout(layoutStabilizeTimeoutRef.current);
      layoutStabilizeTimeoutRef.current = null;
    }

    sweepAnimationRef.current?.stop();
    sweepAnimationRef.current = null;
    initialPulseTriggeredRef.current = false;
    sweepProgress.setValue(0);
  }, [sweepProgress]);

  const runPulse = useCallback(() => {
    if (fillWidth <= 0) {
      return false;
    }

    sweepAnimationRef.current?.stop();
    sweepProgress.setValue(0);

    const animation = Animated.timing(sweepProgress, {
      duration: 1550,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    });

    sweepAnimationRef.current = animation;
    animation.start(() => {
      sweepAnimationRef.current = null;
    });

    return true;
  }, [fillWidth, sweepProgress]);

  const handleFillLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;

      setIsFillLayoutStable(false);
      setFillWidth(prevWidth =>
        Math.abs(prevWidth - nextWidth) > 0.5 ? nextWidth : prevWidth,
      );

      if (layoutStabilizeTimeoutRef.current) {
        clearTimeout(layoutStabilizeTimeoutRef.current);
      }

      layoutStabilizeTimeoutRef.current = setTimeout(() => {
        setIsFillLayoutStable(true);
        layoutStabilizeTimeoutRef.current = null;
      }, 160);
    },
    [setFillWidth],
  );

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
    if (!shouldAnimatePulse) {
      stopPulse();
      return;
    }

    sweepIntervalRef.current = setInterval(runPulse, pulseIntervalMs);

    return () => {
      stopPulse();
    };
  }, [pulseIntervalMs, runPulse, shouldAnimatePulse, stopPulse]);

  useEffect(() => {
    if (!shouldAnimatePulse || !isFillLayoutStable || fillWidth <= 0) {
      return;
    }

    if (initialPulseTriggeredRef.current) {
      return;
    }

    initialPulseTriggeredRef.current = true;
    runPulse();
  }, [fillWidth, isFillLayoutStable, runPulse, shouldAnimatePulse]);

  useEffect(
    () => () => {
      if (layoutStabilizeTimeoutRef.current) {
        clearTimeout(layoutStabilizeTimeoutRef.current);
        layoutStabilizeTimeoutRef.current = null;
      }
    },
    [],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{max: 100, min: 0, now: progressPercent}}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.radius.sm,
          height: theme.spacing[8],
        },
        style,
      ]}>
      <View
        onLayout={handleFillLayout}
        style={[
          styles.fill,
          {
            backgroundColor: theme.colors[color],
            borderRadius: theme.radius.sm,
            width: `${progressPercent}%`,
          },
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sweep,
            {
              opacity: sweepOpacity,
              width: sweepWidth,
              transform: [{translateX: sweepTranslateX}],
            },
          ]}>
          <View style={styles.sweepGradientRow}>
            {sweepGradientStops.map((stopColor, index) => (
              <View
                key={`sweep-stop-${index}`}
                style={[styles.sweepGradientStop, {backgroundColor: stopColor}]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    height: '100%',
    overflow: 'hidden',
  },
  sweep: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  sweepGradientStop: {
    flex: 1,
  },
  sweepGradientRow: {
    flex: 1,
    flexDirection: 'row',
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
