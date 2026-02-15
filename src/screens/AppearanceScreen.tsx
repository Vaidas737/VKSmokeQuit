import {useMemo, useState} from 'react';
import {View} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppListRow} from '@/components/AppListRow';
import {AppSnackbar} from '@/components/AppSnackbar';
import {AppText} from '@/components/AppText';
import {ScreenContainer} from '@/components/ScreenContainer';
import {useTheme} from '@/design/theme/ThemeProvider';
import type {ThemeModePreference} from '@/design/theme';

const THEME_OPTIONS: Array<{
  description: string;
  mode: ThemeModePreference;
  title: string;
}> = [
  {
    description: 'Follows iOS Appearance automatically.',
    mode: 'system',
    title: 'System',
  },
  {
    description: 'Use the earthy light theme at all times.',
    mode: 'light',
    title: 'Light',
  },
  {
    description: 'Use the earthy dark theme at all times.',
    mode: 'dark',
    title: 'Dark',
  },
];

export function AppearanceScreen() {
  const {resolvedMode, setThemeMode, theme, themeMode} = useTheme();
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);

  const resolvedModeLabel = useMemo(() => {
    if (resolvedMode === 'dark') {
      return 'Dark';
    }

    return 'Light';
  }, [resolvedMode]);

  const handleThemeChange = (mode: ThemeModePreference) => {
    setThemeMode(mode)
      .then(() => {
        setSnackbarVisible(true);
      })
      .catch(() => {});
  };

  return (
    <ScreenContainer>
      <View style={{gap: theme.spacing[16]}}>
        <AppCard>
          <AppText color="onSurfaceVariant" style={{marginTop: theme.spacing[8]}} variant="bodySmall">
            Active theme: {resolvedModeLabel}
          </AppText>

          <View style={{marginTop: theme.spacing[12]}}>
            {THEME_OPTIONS.map(option => (
              <AppListRow
                key={option.mode}
                onPress={() => handleThemeChange(option.mode)}
                selected={themeMode === option.mode}
                subtitle={option.description}
                title={option.title}
              />
            ))}
          </View>
        </AppCard>
      </View>

      <AppSnackbar
        actionLabel="Dismiss"
        message="Theme preference updated"
        onDismiss={() => setSnackbarVisible(false)}
        visible={isSnackbarVisible}
      />
    </ScreenContainer>
  );
}
