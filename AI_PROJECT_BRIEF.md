# AI Project Brief: VKSmokeQuit

## Goal

Maintain and extend an iOS-only React Native app using a strict, token-based Material-aligned design system.

## Application Purpose

- Support a smoke-quit journey with a calm, focused, offline-first experience.
- Surface a simple money counter for savings tracking on the Home screen.
- Prioritize clarity and low-friction daily use over feature breadth.
- Keep user trust by avoiding network access and preserving predictable behavior.

## AI Development Role

- Act as a maintainer of product consistency, not a feature experimenter by default.
- Preserve iOS-only, offline-only constraints unless requirements explicitly change.
- Implement UI and behavior through existing tokens, shared components, and typed navigation.
- Keep changes small, testable, and aligned with existing architecture patterns.

## Scope Constraints

- iOS only
- Offline only (no backend, no API calls, no networking abstractions)
- Keep dependencies minimal and practical
- UI must be token-driven; avoid ad hoc styling

## Current Architecture

- Entry: `index.js`, `App.tsx`
- Shared code in `src/`
  - `src/screens`: `HomeScreen`, `CounterScreen`, `AppearanceScreen`, `AboutScreen`
  - `src/navigation`: native-stack setup, route typing, custom top bar wiring
  - `src/components`: reusable `App*` components and shared layout/menu primitives
  - `src/design/tokens`: color/typography/spacing/radius/elevation tokens
  - `src/design/theme`: theme creation, navigation theme mapping, `ThemeProvider`, `useTheme`
  - `src/hooks`: `useThemePreference` for loading/persisting theme mode
  - `src/utils`: AsyncStorage helpers for theme and counter persistence/calculation
  - `src/constants`: route names and storage keys
  - `src/assets`: placeholder for static assets
- Core user flow:
  - `Home`: launch surface, savings totals, drawer entry point
  - `Counter`: update daily amount and reset start date
  - `Appearance`: theme preference management
  - `About`: app context/info screen

## Navigation and Menu UX

- Uses React Navigation native stack (`Home`, `Appearance`, `Counter`, `About`).
- Navigation pattern: **stack header rules** via `AppTopBar`.
- Home header has a left-side menu button.
- Menu opens a custom left slide-in drawer overlay (`LeftDrawerMenu`) with a square edge and responsive width.
- Drawer closes via outside tap or left swipe gesture.
- Opening/closing uses matched slide animation with gentle full-screen dim/undim scrim animation.
- Drawer contains `Appearance` and `Counter`.
- Drawer `Appearance` row uses a leading Material icon (`palette`) and no subtitle/description.
- Drawer `Counter` row uses a leading Material icon (`calculate`) and no subtitle/description.
- Selecting drawer `Appearance` navigates to `AppearanceScreen`.
- Selecting drawer `Counter` navigates to `CounterScreen`.
- Access to `Appearance` and `Counter` is drawer-driven from the Home top bar menu.

## Home Screen Current UX

- Single card with savings data only:
  - `Overall Total`
  - `This Month`
  - `Daily Rate`
  - `Start Date`
- Totals are calculated from persisted counter settings and local date/time.

## Theming and Persistence

- Single source of truth: `ThemeProvider` + `useTheme()`.
- Theme mode options: `system`, `light`, `dark`.
- Effective mode resolves from iOS Appearance when mode is `system`.
- Theme preference persists via `@react-native-async-storage/async-storage`.
- Counter state persists via `@react-native-async-storage/async-storage`:
  - `counterStartDate`
  - `counterDailyAmount`
- Appearance screen exposes explicit mode selection.

## Testing and Tooling

- Jest + `@testing-library/react-native`
- ESLint + Prettier
- Path alias: `@/` -> `src/` (Babel + TypeScript + Jest)

## Material Design Rules

### Typography Rules

- Use one semantic type scale aligned to Material 3 roles only:
  - `display*`, `headline*`, `title*`, `body*`, `label*`
- Body copy defaults to `bodyMedium` unless hierarchy requires otherwise.
- Titles must use `title*` or `headline*`; no manual font-weight overrides in screens.
- Font family is iOS system (`System` / San Francisco default); no external fonts.

### Spacing Rules

- Use 4pt scale only: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Section spacing should use token steps, not custom one-off values.
- Component internal padding and inter-element gaps must use spacing tokens.

### Elevation Rules

- Use only predefined levels `level0..level5`.
- Card/default raised surfaces use `level1`.
- Snackbar uses `level3`.
- Do not define inline shadow styles in screens.

### Component Usage Rules

- Use `App*` components for all screen-level UI:
  - `AppText`, `AppButton`, `AppTextField`, `AppCard`, `AppTopBar`, `AppDialog`, `AppSnackbar`, `AppListRow`
- Navigation header must be `AppTopBar`; no fallback to default stack header styling.
- Menus/settings lists must use `AppListRow`.

### Accessibility Rules

- Minimum interactive target is `>= 44x44` (implemented as `44+` and often `48`).
- Required states:
  - Pressed, disabled, focus for interactive controls.
  - Error for form controls.
- Text/background combinations must remain high contrast in both light and dark themes.
- Persisted theme overrides must not block system appearance support.

## Design Tokens

### Colors (Earthy Palette)

#### Light

- `primary`: `#8A5A44`
- `onPrimary`: `#FFFFFF`
- `secondary`: `#5E6B2F`
- `onSecondary`: `#FFFFFF`
- `tertiary`: `#A14F2B`
- `onTertiary`: `#FFFFFF`
- `background`: `#F5EFE4`
- `onBackground`: `#231D17`
- `surface`: `#FFF8F0`
- `onSurface`: `#231D17`
- `surfaceVariant`: `#E8DDCF`
- `onSurfaceVariant`: `#4E453D`
- `outline`: `#7F756B`
- `error`: `#B3261E`
- `onError`: `#FFFFFF`

#### Dark

- `primary`: `#E0B59D`
- `onPrimary`: `#4A2616`
- `secondary`: `#C3D08E`
- `onSecondary`: `#273100`
- `tertiary`: `#F1B08C`
- `onTertiary`: `#4D1F0B`
- `background`: `#1B1712`
- `onBackground`: `#ECE2D7`
- `surface`: `#231E18`
- `onSurface`: `#ECE2D7`
- `surfaceVariant`: `#3D352E`
- `onSurfaceVariant`: `#D2C6B8`
- `outline`: `#9A8F83`
- `error`: `#F2B8B5`
- `onError`: `#601410`

### Spacing

- `0: 0`
- `4: 4`
- `8: 8`
- `12: 12`
- `16: 16`
- `20: 20`
- `24: 24`
- `32: 32`
- `40: 40`
- `48: 48`

### Radius

- `sm: 8`
- `md: 12`
- `lg: 16`
- `xl: 24`

### Elevation

- `level0`: `shadowOpacity 0`, `shadowRadius 0`, `shadowOffset {0,0}`
- `level1`: `shadowOpacity 0.12`, `shadowRadius 2`, `shadowOffset {0,1}`
- `level2`: `shadowOpacity 0.14`, `shadowRadius 4`, `shadowOffset {0,2}`
- `level3`: `shadowOpacity 0.16`, `shadowRadius 8`, `shadowOffset {0,4}`
- `level4`: `shadowOpacity 0.18`, `shadowRadius 12`, `shadowOffset {0,6}`
- `level5`: `shadowOpacity 0.20`, `shadowRadius 16`, `shadowOffset {0,8}`

### Typography

- `displayLarge`: `57/64`, `400`
- `displayMedium`: `45/52`, `400`
- `displaySmall`: `36/44`, `400`
- `headlineLarge`: `32/40`, `400`
- `headlineMedium`: `28/36`, `400`
- `headlineSmall`: `24/32`, `400`
- `titleLarge`: `22/28`, `400`
- `titleMedium`: `16/24`, `500`
- `titleSmall`: `14/20`, `500`
- `bodyLarge`: `16/24`, `400`
- `bodyMedium`: `14/20`, `400`
- `bodySmall`: `12/16`, `400`
- `labelLarge`: `14/20`, `500`
- `labelMedium`: `12/16`, `500`
- `labelSmall`: `11/16`, `500`

## Component Specifications

### `AppText`

- Props: `variant`, `color`, standard `TextProps`
- States: inherits parent states; semantic text only
- Rules:
  - Uses token typography only
  - Uses token colors only

### `AppButton`

- Props: `variant`, `disabled`, `loading`, `fullWidth`, `onPress`, `children`, `accessibilityLabel`
- States: pressed, disabled/loading, focus
- Rules:
  - Primary: filled `primary`
  - Secondary: filled `secondary`
  - Tertiary: outline/text emphasis
  - Min target `>= 44`

### `AppTextField`

- Props: `label`, `error`, `disabled`, standard `TextInputProps`
- States: default, focused, error, disabled
- Rules:
  - Focus border `primary`
  - Error border/text `error`
  - Disabled dimming uses state opacity tokens
  - Min target `>= 44`

### `AppCard`

- Props: `children`, optional `onPress`, optional `style`
- States: pressed/focus when interactive
- Rules:
  - Uses `surface`, `outline`, `radius.lg`, `elevation.level1`

### `AppTopBar`

- Props: `title`, `leadingIcon`, `onLeadingPress`, `centerTitle`
- States: leading button pressed/focus
- Rules:
  - Safe-area aware
  - Height = top inset + 64
  - Home uses menu icon, child screens use back icon

### `AppDialog`

- Props: `visible`, `title`, `message`, `onDismiss`, optional action labels/callbacks
- States: visible/hidden, action button pressed/focus/disabled
- Rules:
  - Scrim from tokenized overlay opacity
  - Content uses tokenized card and buttons

### `AppSnackbar`

- Props: `visible`, `message`, `durationMs`, optional action label/callback, `onDismiss`
- States: visible/hidden, action pressed/focus
- Rules:
  - Bottom safe-area positioning
  - Auto dismiss default `3000ms`
  - Uses tokenized surface/elevation/text colors

### `AppListRow`

- Props: `title`, `subtitle`, `selected`, `disabled`, optional `onPress`, optional `leading`, optional `trailing`
- States: pressed, focus, disabled, selected
- Rules:
  - Row min height `56`
  - Semantic text styles (`titleMedium`, `bodySmall`)

## Non-negotiables

- Do not deviate from tokens.
- No hardcoded colors or spacing in feature screens/components.
- Any new UI must use existing `App*` components or follow the same token rules.
- Any new interaction must include required states (pressed/disabled/focus/error when applicable).

## Extension Guidance

- Prefer adding features inside `src/` by domain.
- Reuse `ScreenContainer` for screen scaffolding.
- Keep business logic in hooks/utils, not screen components.
- Maintain offline-first behavior unless requirements explicitly change.
- Keep the left drawer pattern consistent if adding more drawer destinations later.
