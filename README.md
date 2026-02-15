# VKSmokeQuit (iOS Only)

Production-ready React Native CLI skeleton app (TypeScript) focused on iOS only.

## Requirements

- Node.js 22+
- Xcode + iOS Simulator
- Ruby + Bundler
- CocoaPods

## Install

```sh
npm install
```

## iOS Setup

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

## Run (iOS Simulator)

```sh
npm run ios
```

## Test

```sh
npm test
```

## Lint

```sh
npm run lint
```

## Format

```sh
npm run format
npm run format:write
```

## App Features

- React Navigation native stack with 3 screens: Home, Counter, Appearance
- React Native Paper UI with light/dark themes
- Theme preference saved locally via AsyncStorage
- Shared reusable components in `src/components`
- `@/` path alias mapped to `src/`
