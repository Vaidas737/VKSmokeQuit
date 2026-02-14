import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import {darkColors, lightColors, type AppColorTokens} from '@/design/tokens/colors';
import {elevation} from '@/design/tokens/elevation';
import {radius} from '@/design/tokens/radius';
import {spacing} from '@/design/tokens/spacing';
import {typography} from '@/design/tokens/typography';

export type ThemeModePreference = 'dark' | 'light' | 'system';
export type ResolvedThemeMode = 'dark' | 'light';
export type SystemColorScheme = 'dark' | 'light' | null;

export type AppTheme = {
  colors: AppColorTokens;
  elevation: typeof elevation;
  isDark: boolean;
  mode: ResolvedThemeMode;
  radius: typeof radius;
  spacing: typeof spacing;
  state: {
    disabledContainerOpacity: number;
    disabledContentOpacity: number;
    focusOpacity: number;
    pressedOpacity: number;
    scrimOpacity: number;
  };
  typography: typeof typography;
};

const stateTokens = {
  disabledContainerOpacity: 0.12,
  disabledContentOpacity: 0.38,
  focusOpacity: 0.12,
  pressedOpacity: 0.12,
  scrimOpacity: 0.48,
} as const;

export const themes: Record<ResolvedThemeMode, AppTheme> = {
  dark: {
    colors: darkColors,
    elevation,
    isDark: true,
    mode: 'dark',
    radius,
    spacing,
    state: stateTokens,
    typography,
  },
  light: {
    colors: lightColors,
    elevation,
    isDark: false,
    mode: 'light',
    radius,
    spacing,
    state: stateTokens,
    typography,
  },
};

export const resolveThemeMode = (
  preference: ThemeModePreference,
  systemColorScheme: SystemColorScheme,
): ResolvedThemeMode => {
  if (preference === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }

  return preference;
};

export const getTheme = (mode: ResolvedThemeMode): AppTheme => themes[mode];

export const getNavigationTheme = (theme: AppTheme): NavigationTheme => {
  const baseTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme.colors.background,
      border: theme.colors.outline,
      card: theme.colors.surface,
      notification: theme.colors.error,
      primary: theme.colors.primary,
      text: theme.colors.onSurface,
    },
  };
};

export const withOpacity = (hexColor: string, opacity: number): string => {
  const normalized = hexColor.replace('#', '');

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};
