import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {AppText} from '@/components/AppText';
import {withOpacity} from '@/design/theme';
import {useTheme} from '@/design/theme/ThemeProvider';

export type AppSnackbarTone = 'error' | 'info' | 'success';

type AppSnackbarProps = {
  actionLabel?: string;
  durationMs?: number;
  eventId?: number | string;
  message: string;
  onAction?: () => void;
  onDismiss: () => void;
  tone?: AppSnackbarTone;
  visible: boolean;
};

export function AppSnackbar({
  actionLabel,
  durationMs = 3000,
  eventId,
  message,
  onAction,
  onDismiss,
  tone = 'info',
  visible,
}: AppSnackbarProps) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const successRingOpacity = useRef(new Animated.Value(0)).current;
  const successRingScale = useRef(new Animated.Value(0.75)).current;
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);
  const onActionRef = useRef(onAction);
  const [isActionFocused, setActionFocused] = useState(false);
  const replayKey = eventId ?? `${tone}:${message}`;

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);
  const toneVisual = useMemo(() => {
    if (tone === 'success') {
      return {
        badgeColor: withOpacity(theme.colors.primary, theme.state.focusOpacity),
        iconColor: theme.colors.primary,
        iconName: 'check' as const,
        messageColor: theme.colors.onSurfaceVariant,
      };
    }

    if (tone === 'error') {
      return {
        badgeColor: withOpacity(theme.colors.error, theme.state.focusOpacity),
        iconColor: theme.colors.error,
        iconName: 'error-outline' as const,
        messageColor: theme.colors.onSurfaceVariant,
      };
    }

    return {
      badgeColor: withOpacity(theme.colors.tertiary, theme.state.focusOpacity),
      iconColor: theme.colors.tertiary,
      iconName: 'info-outline' as const,
      messageColor: theme.colors.onSurfaceVariant,
    };
  }, [theme.colors.error, theme.colors.onSurfaceVariant, theme.colors.primary, theme.colors.tertiary, theme.state.focusOpacity, tone]);

  useEffect(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 140,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 140,
          toValue: 12,
          useNativeDriver: true,
        }),
      ]).start();

      successRingOpacity.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    if (tone === 'success') {
      successRingScale.setValue(0.75);
      successRingOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(successRingScale, {
            duration: 140,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(successRingOpacity, {
            duration: 140,
            toValue: 0.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(successRingScale, {
            duration: 220,
            easing: Easing.in(Easing.quad),
            toValue: 1.35,
            useNativeDriver: true,
          }),
          Animated.timing(successRingOpacity, {
            duration: 220,
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      successRingOpacity.setValue(0);
    }

    dismissTimeoutRef.current = setTimeout(() => {
      onDismissRef.current();
    }, durationMs);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [
    durationMs,
    opacity,
    replayKey,
    successRingOpacity,
    successRingScale,
    tone,
    translateY,
    visible,
  ]);

  if (!visible) {
    return null;
  }

  const handleAction = () => {
    onActionRef.current?.();
    onDismissRef.current();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + 16,
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View
        style={[
          styles.container,
          styles.minHeight,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing[16],
            paddingVertical: theme.spacing[12],
          },
          theme.elevation.level3,
        ]}>
        <View style={[styles.leading, {marginRight: theme.spacing[12]}]}>
          {tone === 'success' ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.successRing,
                {
                  borderColor: theme.colors.primary,
                  borderRadius: theme.radius.md,
                  opacity: successRingOpacity,
                  transform: [{scale: successRingScale}],
                },
              ]}
            />
          ) : null}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: toneVisual.badgeColor,
                borderRadius: theme.radius.sm,
                height: theme.spacing[24],
                width: theme.spacing[24],
              },
            ]}>
            <MaterialIcons
              color={toneVisual.iconColor}
              name={toneVisual.iconName}
              size={theme.spacing[16]}
            />
          </View>
        </View>
        <AppText
          style={[styles.message, {color: toneVisual.messageColor}]}
          variant="bodyMedium">
          {message}
        </AppText>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onBlur={() => setActionFocused(false)}
            onFocus={() => setActionFocused(true)}
            onPress={handleAction}
            style={({pressed}) => [
              styles.action,
              {
                borderColor: isActionFocused ? theme.colors.primary : 'transparent',
                borderRadius: theme.radius.sm,
                borderWidth: isActionFocused ? 1 : 0,
              },
              pressed ? styles.pressed : null,
            ]}>
            <AppText color="tertiary" variant="labelLarge">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  message: {
    flex: 1,
    marginRight: 8,
  },
  minHeight: {
    minHeight: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  successRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  wrapper: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
});
