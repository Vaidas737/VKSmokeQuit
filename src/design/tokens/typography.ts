import type {TextStyle} from 'react-native';

export type TypographyVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

export type TypographyTokens = Record<TypographyVariant, TextStyle>;

const SF_FONT = 'System';

export const typography: TypographyTokens = {
  displayLarge: {
    fontFamily: SF_FONT,
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: SF_FONT,
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: SF_FONT,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: SF_FONT,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: SF_FONT,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: SF_FONT,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: SF_FONT,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: SF_FONT,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: SF_FONT,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: SF_FONT,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: SF_FONT,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: SF_FONT,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: SF_FONT,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: SF_FONT,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: SF_FONT,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
};
