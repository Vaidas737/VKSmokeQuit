import {useCallback, useEffect, useState} from 'react';

import {
  getStoredThemeMode,
  saveStoredThemeMode,
  type StoredThemeMode,
} from '@/utils/themeStorage';

type UseThemePreferenceResult = {
  isReady: boolean;
  setThemeMode: (mode: StoredThemeMode) => Promise<void>;
  themeMode: StoredThemeMode;
  toggleTheme: () => Promise<void>;
};

export function useThemePreference(): UseThemePreferenceResult {
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<StoredThemeMode>('system');

  useEffect(() => {
    let isMounted = true;

    const hydrateThemeMode = async () => {
      const storedMode = await getStoredThemeMode();

      if (isMounted && storedMode) {
        setMode(storedMode);
      }

      if (isMounted) {
        setIsReady(true);
      }
    };

    hydrateThemeMode().catch(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (nextMode: StoredThemeMode) => {
    setMode(nextMode);
    await saveStoredThemeMode(nextMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode: StoredThemeMode = mode === 'dark' ? 'light' : 'dark';
    await setThemeMode(nextMode);
  }, [mode, setThemeMode]);

  return {
    isReady,
    setThemeMode,
    themeMode: mode,
    toggleTheme,
  };
}
