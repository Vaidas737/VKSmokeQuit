import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Appearance} from 'react-native';
import {AppOverlayProvider} from '@/components/overlay/AppOverlayProvider';

import {useThemePreference} from '@/hooks/useThemePreference';
import {
  getTheme,
  resolveThemeMode,
  type AppTheme,
  type ResolvedThemeMode,
  type SystemColorScheme,
  type ThemeModePreference,
} from './index';

type ThemeContextValue = {
  isReady: boolean;
  resolvedMode: ResolvedThemeMode;
  setThemeMode: (mode: ThemeModePreference) => Promise<void>;
  theme: AppTheme;
  themeMode: ThemeModePreference;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const normalizeColorScheme = (
  colorScheme: ReturnType<typeof Appearance.getColorScheme>,
): SystemColorScheme => {
  if (colorScheme === 'dark' || colorScheme === 'light') {
    return colorScheme;
  }

  return null;
};

export function ThemeProvider({children}: PropsWithChildren) {
  const {isReady, setThemeMode, themeMode, toggleTheme} = useThemePreference();
  const [systemColorScheme, setSystemColorScheme] =
    useState<SystemColorScheme>(normalizeColorScheme(Appearance.getColorScheme()));

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setSystemColorScheme(normalizeColorScheme(colorScheme));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const resolvedMode = resolveThemeMode(themeMode, systemColorScheme);
  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isReady,
      resolvedMode,
      setThemeMode,
      theme,
      themeMode,
      toggleTheme,
    }),
    [isReady, resolvedMode, setThemeMode, theme, themeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <AppOverlayProvider>{children}</AppOverlayProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
