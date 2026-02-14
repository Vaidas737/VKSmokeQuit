import {useEffect, useRef} from 'react';
import {useState} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';

type AppSnackbarProps = {
  actionLabel?: string;
  durationMs?: number;
  message: string;
  onAction?: () => void;
  onDismiss: () => void;
  visible: boolean;
};

export function AppSnackbar({
  actionLabel,
  durationMs = 3000,
  message,
  onAction,
  onDismiss,
  visible,
}: AppSnackbarProps) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const [isActionFocused, setActionFocused] = useState(false);

  useEffect(() => {
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

      return;
    }

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

    const timeout = setTimeout(onDismiss, durationMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [durationMs, onDismiss, opacity, translateY, visible]);

  if (!visible) {
    return null;
  }

  const handleAction = () => {
    onAction?.();
    onDismiss();
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
        <AppText color="onSurfaceVariant" style={styles.message} variant="bodyMedium">
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
    minHeight: 32,
    paddingHorizontal: 8,
  },
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  message: {
    flex: 1,
    marginRight: 12,
  },
  minHeight: {
    minHeight: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  wrapper: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
});
