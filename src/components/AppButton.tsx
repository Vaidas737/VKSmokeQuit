import {useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';

import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';
import {AppText} from '@/components/AppText';
import type {AppColorTokens} from '@/design/tokens/colors';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

type AppButtonProps = {
  accessibilityLabel?: string;
  children: string;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  onPress: () => void;
  variant?: ButtonVariant;
};

type VariantStyles = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  contentColor: string;
};

const getVariantStyles = (
  variant: ButtonVariant,
  disabled: boolean,
  colors: AppColorTokens,
  disabledContainerOpacity: number,
  disabledContentOpacity: number,
): VariantStyles => {
  if (variant === 'primary') {
    return {
      backgroundColor: disabled
        ? withOpacity(colors.onSurface, disabledContainerOpacity)
        : colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
      contentColor: disabled
        ? withOpacity(colors.onSurface, disabledContentOpacity)
        : colors.onPrimary,
    };
  }

  if (variant === 'secondary') {
    return {
      backgroundColor: disabled
        ? withOpacity(colors.onSurface, disabledContainerOpacity)
        : colors.secondary,
      borderColor: 'transparent',
      borderWidth: 0,
      contentColor: disabled
        ? withOpacity(colors.onSurface, disabledContentOpacity)
        : colors.onSecondary,
    };
  }

  return {
    backgroundColor: 'transparent',
    borderColor: disabled
      ? withOpacity(colors.onSurface, disabledContentOpacity)
      : colors.outline,
    borderWidth: 1,
    contentColor: disabled
      ? withOpacity(colors.onSurface, disabledContentOpacity)
      : colors.tertiary,
  };
};

export function AppButton({
  accessibilityLabel,
  children,
  disabled = false,
  fullWidth = true,
  loading = false,
  onPress,
  variant = 'primary',
}: AppButtonProps) {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(
    variant,
    isDisabled,
    theme.colors,
    theme.state.disabledContainerOpacity,
    theme.state.disabledContentOpacity,
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={4}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: isFocused ? theme.colors.primary : variantStyles.borderColor,
          borderRadius: theme.radius.lg,
          borderWidth: isFocused ? 2 : variantStyles.borderWidth,
          minHeight: 44,
          paddingHorizontal: theme.spacing[16],
          width: fullWidth ? '100%' : undefined,
        },
        variant === 'tertiary' ? theme.elevation.level0 : theme.elevation.level1,
        pressed && !isDisabled ? styles.pressed : null,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variantStyles.contentColor} size="small" />
        ) : (
          <AppText style={{color: variantStyles.contentColor}} variant="labelLarge">
            {children}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.9,
  },
});
