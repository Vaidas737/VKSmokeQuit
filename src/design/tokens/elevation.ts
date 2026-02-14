import type {ViewStyle} from 'react-native';

export type ElevationLevel = 'level0' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export type ElevationTokens = Record<ElevationLevel, ViewStyle>;

export const elevation: ElevationTokens = {
  level0: {
    shadowColor: '#231D17',
    shadowOffset: {height: 0, width: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  level1: {
    shadowColor: '#231D17',
    shadowOffset: {height: 1, width: 0},
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  level2: {
    shadowColor: '#231D17',
    shadowOffset: {height: 2, width: 0},
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  level3: {
    shadowColor: '#231D17',
    shadowOffset: {height: 4, width: 0},
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  level4: {
    shadowColor: '#231D17',
    shadowOffset: {height: 6, width: 0},
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  level5: {
    shadowColor: '#231D17',
    shadowOffset: {height: 8, width: 0},
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
};
