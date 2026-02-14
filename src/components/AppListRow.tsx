import type {ReactNode} from 'react';
import {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppListRowProps = {
  disabled?: boolean;
  leading?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  subtitle?: string;
  title: string;
  trailing?: ReactNode;
};

export function AppListRow({
  disabled = false,
  leading,
  onPress,
  selected = false,
  subtitle,
  title,
  trailing,
}: AppListRowProps) {
  const {theme} = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const content = (
    <View
      style={[
        styles.row,
        styles.minHeight,
        {
          paddingHorizontal: theme.spacing[12],
          paddingVertical: theme.spacing[8],
        },
      ]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.textContent}>
        <AppText
          style={{
            color: disabled
              ? withOpacity(theme.colors.onSurface, theme.state.disabledContentOpacity)
              : theme.colors.onSurface,
          }}
          variant="titleMedium">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="onSurfaceVariant" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {selected ? <View style={[styles.dot, {backgroundColor: theme.colors.primary}]} /> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({pressed}) => [
        {
          backgroundColor: pressed
            ? withOpacity(theme.colors.onSurface, theme.state.pressedOpacity)
            : 'transparent',
          borderColor: isFocused ? theme.colors.primary : 'transparent',
          borderRadius: theme.radius.md,
          borderWidth: isFocused ? 2 : 0,
          opacity: disabled ? theme.state.disabledContentOpacity : 1,
        },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 4,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  minHeight: {
    minHeight: 56,
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
