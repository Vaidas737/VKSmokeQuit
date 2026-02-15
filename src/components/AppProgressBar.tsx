import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '@/design/theme/ThemeProvider';
import type {AppColorTokens} from '@/design/tokens/colors';

type AppProgressBarProps = {
  accessibilityLabel?: string;
  color?: keyof AppColorTokens;
  progress: number;
  style?: StyleProp<ViewStyle>;
};

export function AppProgressBar({
  accessibilityLabel,
  color = 'secondary',
  progress,
  style,
}: AppProgressBarProps) {
  const {theme} = useTheme();
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressPercent = Math.round(clampedProgress * 100);

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
        style={[
          styles.fill,
          {
            backgroundColor: theme.colors[color],
            borderRadius: theme.radius.sm,
            width: `${progressPercent}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    height: '100%',
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
