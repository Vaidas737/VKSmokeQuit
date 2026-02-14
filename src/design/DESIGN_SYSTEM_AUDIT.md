# Design Audit and Refactor Plan

## A) Design Audit (Current Inconsistencies -> Material Principle)

- `react-native-paper` + custom styles were mixed, resulting in inconsistent visual semantics across screens and navigation.
  - Material principle: one design system source of truth (tokens + components).
- Typography variants were partially used, but font weight overrides (`fontWeight: '700'`) and ad hoc spacing broke hierarchy consistency.
  - Material principle: consistent type scale and semantic text roles.
- Hardcoded spacing/radius values (`10`, `12`, `14`, `18`, `20`, `280`) were spread across components.
  - Material principle: deterministic spacing and shape tokens.
- Elevation behavior varied by component and depended on Paper defaults rather than app-level tokens.
  - Material principle: predictable elevation levels and depth cues.
- Interaction states were inconsistent: some controls had no pressed/focus styling and no shared disabled treatment.
  - Material principle: explicit state layers for pressed/focus/disabled/error.
- Drawer and menu controls did not enforce a strict minimum touch target strategy across all interactive rows.
  - Material principle: accessibility touch targets and focus affordances.
- Theme persistence handled only light/dark and did not consistently model system mode as a first-class theme source.
  - Material principle: adaptive theming and user/system preference handling.

## C) Component Rules (Strict DO / DON’T + Exact Styling Rules)

### Global Rules

- DO use `App*` components and tokenized theme values exclusively.
- DO keep minimum interactive target `>= 44x44` (implemented as `48` where practical).
- DO apply consistent state behavior:
  - Pressed: reduced opacity / state overlay.
  - Focus: primary-colored outline.
  - Disabled: content opacity `0.38`, container opacity `0.12`.
  - Error (inputs): `error` border + helper text.
- DON’T hardcode colors, typography, spacing, radius, or elevation in feature screens.

### Button (`AppButton`)

- Variants:
  - `primary`: background `primary`, text `onPrimary`, elevation `level1`.
  - `secondary`: background `secondary`, text `onSecondary`, elevation `level1`.
  - `tertiary`: transparent, border `outline`, text `tertiary`, elevation `level0`.
- Sizing: min height `44+`, horizontal padding from spacing tokens, radius `lg`.
- States:
  - Pressed: opacity reduction.
  - Disabled/loading: disabled opacity tokens.
  - Focus: primary border ring.
- DON’T place raw `Pressable` buttons in screens for standard CTA behavior.

### TextField (`AppTextField`)

- Label: `labelLarge`; helper/error text: `labelMedium`.
- Container: `surface` background, radius `md`, outline border.
- States:
  - Default: border `outline`.
  - Focused: border `primary` + `level1` elevation.
  - Error: border `error`, helper text `error`.
  - Disabled: dimmed container/content with disabled opacity tokens.
- Touch target: field container min height `>= 44`.
- DON’T use inline `TextInput` styles in feature screens.

### Top App Bar (`AppTopBar`)

- Navigation pattern: **stack header rules** (iOS-only).
- Height: safe-area top inset + 64 content height.
- Title: `titleLarge`.
- Leading control:
  - Home: menu icon.
  - Child screens: back icon.
- Leading control hit target: `44+`.
- Surface: `surface` with bottom outline divider.
- DON’T rely on native-stack default header styles.

### Navigation

- Chosen pattern: **stack navigation with custom `AppTopBar` header**.
- Header title strategy:
  - Home: "Smoke-Free Journey".
  - Settings/About: route title.
- Screen background: token `background` from theme.
- DON’T use mixed tab/header paradigms.

### Card (`AppCard`)

- Container: `surface`, border `outline`, radius `lg`, elevation `level1`.
- Interactive card mode:
  - Pressed: state layer/opacity.
  - Focus: primary outline.
- DON’T build ad hoc section containers with repeated border/shadow values.

### Dialog / Modal (`AppDialog`)

- Backdrop: `onBackground` at scrim opacity token.
- Dialog surface: tokenized `AppCard`.
- Title/body typography: `headlineSmall` + `bodyMedium`.
- Actions: tokenized `AppButton` (`tertiary` + `primary`).
- DON’T implement custom modal visuals outside this pattern.

### Snackbar / Toast (`AppSnackbar`)

- Container: `surfaceVariant`, text `onSurfaceVariant`, border `outline`, elevation `level3`.
- Action: tokenized pressable text (`tertiary` color).
- Placement: bottom with safe-area inset.
- Duration: auto-dismiss default `3000ms`.
- DON’T use Alert for transient in-flow feedback.

### List Rows (`AppListRow`)

- Row min height: `56`.
- Text styles: `titleMedium` + optional `bodySmall` subtitle.
- States:
  - Pressed: state overlay.
  - Focus: primary outline.
  - Disabled: dimmed content.
  - Selected: primary indicator dot.
- DON’T place raw `Pressable` rows in menus/settings lists.

## D) Implementation Plan (Ordered, Regression-Minimizing)

1. Introduce theme tokens (`colors`, `typography`, `spacing`, `radius`, `elevation`) and `src/design/theme/index.ts`.
2. Upgrade theme persistence to include `system` mode and wire system theme resolution using `Appearance`.
3. Create `ThemeProvider` + `useTheme()` as single source of truth.
4. Build token-driven primitives (`AppText`, `AppButton`, `AppTextField`, `AppCard`, `AppTopBar`, `AppDialog`, `AppSnackbar`, `AppListRow`).
5. Refactor shared layout/navigation (`ScreenContainer`, `LeftDrawerMenu`, `AppNavigator`) to consume theme + App components.
6. Refactor main screens (`Home`, `Settings`, `About`) to remove hardcoded styles/colors and use App components only.
7. Remove legacy Paper/theme artifacts (`src/theme/*`, `PrimaryButton`).
8. Update tests to mount screens under `ThemeProvider`.
9. Update `AI_PROJECT_BRIEF.md` with strict design system rules, full tokens, specs, and non-negotiables.

### Hardcoded Replacement Checklist

- [x] Colors replaced with `theme.colors.*`
- [x] Typography replaced with `theme.typography.*` via `AppText`
- [x] Spacing replaced with `theme.spacing[*]` in screen-level layout
- [x] Radius replaced with `theme.radius.*`
- [x] Shadows replaced with `theme.elevation.*`
- [x] Pressed/focus/disabled/error states standardized in reusable components
- [x] Top app bar standardized via `AppTopBar`
- [x] Main screens migrated to `App*` primitives
