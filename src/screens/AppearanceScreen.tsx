import {useMemo, useRef, useState} from 'react';
import {View} from 'react-native';

import {AppCard} from '@/components/AppCard';
import {AppListRow} from '@/components/AppListRow';
import {AppSnackbar, type AppSnackbarTone} from '@/components/AppSnackbar';
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

type SnackbarState = {
  eventId: number;
  message: string;
  tone: AppSnackbarTone;
  visible: boolean;
};

const getThemeTitle = (mode: ThemeModePreference): string => {
  const option = THEME_OPTIONS.find(themeOption => themeOption.mode === mode);

  return option?.title ?? 'Theme';
};

export function AppearanceScreen() {
  const {resolvedMode, setThemeMode, theme, themeMode} = useTheme();
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    eventId: 0,
    message: '',
    tone: 'info',
    visible: false,
  });
  const latestThemeChangeRequestIdRef = useRef(0);

  const resolvedModeLabel = useMemo(() => {
    if (resolvedMode === 'dark') {
      return 'Dark';
    }

    return 'Light';
  }, [resolvedMode]);

  const showSnackbar = (message: string, tone: AppSnackbarTone) => {
    setSnackbar(previous => ({
      eventId: previous.eventId + 1,
      message,
      tone,
      visible: true,
    }));
  };

  const handleThemeChange = (mode: ThemeModePreference) => {
    const modeTitle = getThemeTitle(mode);

    if (mode === themeMode) {
      showSnackbar(`${modeTitle} theme is already active`, 'info');
      return;
    }

    latestThemeChangeRequestIdRef.current += 1;
    const requestId = latestThemeChangeRequestIdRef.current;

    setThemeMode(mode)
      .then(() => {
        if (requestId !== latestThemeChangeRequestIdRef.current) {
          return;
        }

        showSnackbar(`Theme changed to ${modeTitle}`, 'success');
      })
      .catch(() => {
        if (requestId !== latestThemeChangeRequestIdRef.current) {
          return;
        }

        showSnackbar('Unable to update theme preference', 'error');
      });
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
        eventId={snackbar.eventId}
        message={snackbar.message}
        onDismiss={() =>
          setSnackbar(previous => ({
            ...previous,
            visible: false,
          }))
        }
        tone={snackbar.tone}
        visible={snackbar.visible}
      />
    </ScreenContainer>
  );
}
