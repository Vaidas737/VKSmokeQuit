import type {PropsWithChildren} from 'react';
import {useState} from 'react';
import {Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppCardProps = PropsWithChildren<{
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({children, onPress, style}: AppCardProps) {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={4}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onPress={onPress}
        style={({pressed}) => [
          styles.base,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isFocused ? theme.colors.primary : theme.colors.outline,
            borderRadius: theme.radius.lg,
            borderWidth: isFocused ? 2 : 1,
            padding: theme.spacing[16],
          },
          theme.elevation.level1,
          pressed ? {backgroundColor: withOpacity(theme.colors.surface, 0.9)} : null,
          style,
        ]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[16],
        },
        styles.border,
        theme.elevation.level1,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
  border: {
    borderWidth: 1,
  },
});
