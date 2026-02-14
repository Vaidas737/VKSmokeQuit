import AsyncStorage from '@react-native-async-storage/async-storage';

import {STORAGE_KEYS} from '@/constants/storage';

export type StoredThemeMode = 'dark' | 'light' | 'system';

const isStoredThemeMode = (value: string): value is StoredThemeMode =>
  value === 'dark' || value === 'light' || value === 'system';

export const getStoredThemeMode = async (): Promise<StoredThemeMode | null> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.themeMode);
    if (!value || !isStoredThemeMode(value)) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
};

export const saveStoredThemeMode = async (
  mode: StoredThemeMode,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, mode);
  } catch {
    // Non-blocking for app startup and navigation.
  }
};
