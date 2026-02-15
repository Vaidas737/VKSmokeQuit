# AGENTS.md

Project agent instructions for `/Users/vaidas/code/VKSmokeQuit`.

## Mission

Maintain and extend the app with consistency and minimal risk. Prioritize product stability over experimentation.

## Product Scope

- Platform: iOS only.
- Runtime model: offline only.
- No backend, no API calls, no networking abstractions.
- Keep dependencies minimal and practical.

## Development Role

- Act as a maintainer, not a feature experimenter by default.
- Keep changes small, testable, and aligned to current architecture.
- Preserve predictable behavior and user trust.

## Architecture Boundaries

- Entry points: `index.js`, `App.tsx`.
- Main code under `src/`.
- Screens: `HomeScreen`, `CounterScreen`, `AppearanceScreen`.
- Navigation: typed native stack + custom top bar.
- Shared UI: `App*` components in `src/components`.
- Theme and tokens are the single design source of truth.
- Business logic belongs in hooks/utils, not screen components.

## Navigation Rules

- Stack routes: `Home`, `Appearance`, `Counter`.
- Header implementation must use `AppTopBar`.
- Home header uses leading menu button.
- On Home, if the withdraw dialog or withdrawal-details dialog is open, pressing the menu button closes the open dialog.
- Child screens use back icon behavior.
- Drawer is a custom left slide-in overlay (`LeftDrawerMenu`), square edge, responsive width.
- Drawer closes via outside tap or left swipe.
- Open/close animation must be matched slide + dim/undim scrim.
- Drawer items order: `Counter` first, `Appearance` second.
- Drawer rows:
  - `Counter`: leading `calculate` icon, no subtitle.
  - `Appearance`: leading `palette` icon, no subtitle.

## Current UX Expectations

- Home screen layout:
  - Main screen content is static (no full-screen vertical scroll).
  - Top summary (outside cards): centered larger total value (no label), tappable to open the withdraw dialog.
  - First card: `This Month` and `Month Remaining` (percentage + progress bar + days left in month).
    - `Month Remaining` progress bar runs a smooth left-to-right gradient sweep while Home is focused and no popup/dialog is open (`pulseIntervalMs=2200`).
  - Withdrawal History card is vertically scrollable inside the card.
    - Rows are tappable and use subtle press animation.
    - Tapping a row opens a details dialog with amount/date and `Cancel` + `Delete` actions.
    - Deleting a row removes it from history and recalculates the top total amount.
    - Show a bottom gradient dim overlay while more history items are available below; hide it at list end.
  - Bottom-centered branding credit on Home only: `powered by willpower.` (inscription-style treatment).
- Counter values are based on persisted settings and local date/time.

## Theme and Persistence Rules

- Theme source of truth: `ThemeProvider` + `useTheme()`.
- Theme modes: `system`, `light`, `dark`.
- `system` mode resolves against iOS appearance.
- Persist theme mode and counter settings with AsyncStorage.
- Counter keys:
  - `counterStartDate`
  - `counterDailyAmount`

## Required Shared Components

Use these for all screen-level UI:

- `AppText`
- `AppButton`
- `AppTextField`
- `AppCard`
- `AppTopBar`
- `AppDialog`
- `AppSnackbar`
- `AppListRow`
- `AppProgressBar`

Rules:

- Do not style around shared components unless truly necessary.
- Menus/settings lists must use `AppListRow`.

## Design System Non-Negotiables

- No hardcoded colors or spacing in feature screens/components.
- Use tokens only for color/typography/spacing/radius/elevation.
- Do not add inline shadow styles in screens.
- Any new interaction must support required states where applicable.

## Material/Typography Rules

- Use Material 3 semantic roles only:
  - `display*`, `headline*`, `title*`, `body*`, `label*`
- Body copy defaults to `bodyMedium` unless hierarchy needs otherwise.
- Titles use `title*` or `headline*`; no manual font-weight overrides in screens.
- Font family remains iOS system (`System` / SF default). No external fonts.

## Spacing, Radius, Elevation

- Spacing scale only: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Radius tokens:
  - `sm: 8`
  - `md: 12`
  - `lg: 16`
  - `xl: 24`
- Elevation levels only: `level0..level5`.
- Defaults:
  - Card/raised surface: `level1`
  - Snackbar: `level3`

## Accessibility Requirements

- Minimum interactive target: `>= 44x44` (typically `48`).
- Interactive controls: pressed, disabled, focus states.
- Form controls: include error state.
- Maintain high contrast in both light/dark themes.
- Persisted theme override must not break `system` mode behavior.

## Component Behavior Baselines

- `AppButton`: primary/secondary filled variants; tertiary outline/text emphasis; min target `>= 44`.
- `AppTextField`: focus uses `primary`; error uses `error`; disabled uses state opacity tokens.
- `AppCard`: tokenized surface/outline/radius/elevation; interactive states when pressable.
- `AppTopBar`: safe-area aware, height `top inset + 64`, no bottom separator line.
- `AppDialog`: tokenized scrim + card/buttons, rendered as in-tree absolute overlay (not `Modal`).
- `AppSnackbar`: bottom safe-area placement, default auto-dismiss `3000ms`, tokenized style, supports `tone` (`success`/`info`/`error`) and event-based replay via `eventId`.
- Snackbar layering/timing invariant: opening dialogs/popups must not reset snackbar animation/timer; snackbar remains visually on top and undimmed.
- `AppListRow`: min height `56`, semantic typography (`titleMedium`, `bodySmall`).
  - Optional press animation for tappable rows: subtle scale+fade on press in/out.
- `AppProgressBar`: tokenized track/fill, clamped `0..1` progress, accessible `progressbar` semantics.
  - Optional periodic sweep props: `pulseIntervalMs`, `pulseEnabled`.
  - Sweep is smooth left-to-right gradient overlay and is disabled when iOS Reduce Motion is enabled.
  - First sweep triggers after fill layout stabilizes to avoid jank on initial app open.

## Preferred Workflow For Changes

1. Reuse existing `App*` components and tokens before introducing anything new.
2. Keep domain changes inside `src/` and preserve typed navigation.
3. Keep logic in hooks/utils and UI in screens/components.
4. Add or update tests for changed behavior when practical.
5. Run lint/tests relevant to touched code.

## Extension Guidance

- Reuse `ScreenContainer` for new screen scaffolding.
- Keep drawer interaction pattern consistent if adding destinations.
- Preserve offline-first behavior unless requirements explicitly change.
