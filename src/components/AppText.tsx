import type {PropsWithChildren} from 'react';
import {Text, type StyleProp, type TextProps, type TextStyle} from 'react-native';

import {useTheme} from '@/design/theme/ThemeProvider';
import type {AppColorTokens} from '@/design/tokens/colors';
import type {TypographyVariant} from '@/design/tokens/typography';

type AppTextProps = PropsWithChildren<
  TextProps & {
    color?: keyof AppColorTokens;
    style?: StyleProp<TextStyle>;
    variant?: TypographyVariant;
  }
>;

export function AppText({
  children,
  color,
  style,
  variant = 'bodyMedium',
  ...props
}: AppTextProps) {
  const {theme} = useTheme();

  return (
    <Text
      {...props}
      style={[
        theme.typography[variant],
        {color: color ? theme.colors[color] : theme.colors.onSurface},
        style,
      ]}>
      {children}
    </Text>
  );
}
