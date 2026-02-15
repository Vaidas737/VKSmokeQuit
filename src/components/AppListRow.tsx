import type {ReactNode} from 'react';
import {useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';

import {AppText} from '@/components/AppText';
import {useTheme} from '@/design/theme/ThemeProvider';
import {withOpacity} from '@/design/theme';

type AppListRowProps = {
  animateOnPress?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  subtitle?: string;
  title: string;
  trailing?: ReactNode;
};

export function AppListRow({
  animateOnPress = false,
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
  const rowScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
    if (!animateOnPress || disabled) {
      return;
    }

    rowScale.stopAnimation();
    rowOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(rowScale, {
        duration: 90,
        toValue: 0.985,
        useNativeDriver: true,
      }),
      Animated.timing(rowOpacity, {
        duration: 90,
        toValue: 0.96,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!animateOnPress || disabled) {
      return;
    }

    rowScale.stopAnimation();
    rowOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(rowScale, {
        duration: 140,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rowOpacity, {
        duration: 140,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const animatedContentStyle = animateOnPress
    ? {
        opacity: rowOpacity,
        transform: [{scale: rowScale}],
      }
    : styles.animatedContentStatic;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={4}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
      <Animated.View
        style={[
          styles.animatedContent,
          animatedContentStyle,
        ]}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  animatedContent: {
    width: '100%',
  },
  animatedContentStatic: {
    opacity: 1,
    transform: [{scale: 1}],
  },
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
