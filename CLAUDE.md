# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo Version

This project uses **Expo SDK 56**. Always read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code — Expo APIs change significantly between versions.

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Start with iOS simulator
npm run android    # Start with Android emulator
npm run lint       # Run ESLint via expo lint
```

No test runner is configured yet. Web output is enabled but the primary targets are **iOS and Android**.

## Project Structure

Source lives in `src/` (not the default Expo `app/` directory). TypeScript path aliases:
- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

Routing uses Expo Router file-based routing with typed routes enabled. Route files are in `src/app/`. Platform-specific implementations use the `.web.tsx` / `.web.ts` suffix (e.g., `app-tabs.web.tsx`, `animated-icon.web.tsx`, `use-color-scheme.web.ts`). The React Compiler is enabled — avoid manual `useMemo`/`useCallback` unless profiling shows a need.

## Styling

The project uses **NativeWind** (Tailwind CSS for React Native). Apply styles via the `className` prop. `src/global.css` is the Tailwind entry point and defines web font CSS variables. Do not use `StyleSheet.create` for new components — use Tailwind utility classes.

`src/constants/theme.ts` holds design tokens (`Colors`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth`) that underpin the NativeWind theme config. Prefer the Tailwind classes that map to these tokens over raw values.

## Theming

`useTheme()` (`src/hooks/use-theme.ts`) returns the active `Colors.light` or `Colors.dark` object. `ThemedText` and `ThemedView` are the standard UI primitives for theme-aware text and backgrounds:

- `ThemedText` accepts `type` (`'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code'`) and an optional `themeColor` to override the color token.
- `ThemedView` accepts `type` as a `ThemeColor` key to set the background (`'background' | 'backgroundElement' | 'backgroundSelected'`).

## Navigation

The root layout (`src/app/_layout.tsx`) wraps the app in `ThemeProvider` and renders `AppTabs`. On native, `AppTabs` uses `NativeTabs` from `expo-router/unstable-native-tabs`. The web variant (`app-tabs.web.tsx`) uses `Tabs`/`TabList`/`TabTrigger` from `expo-router/ui`.

## Animations

Uses React Native Reanimated 4.x `Keyframe` API. Worklet callbacks must be marked `'worklet'` and use `scheduleOnRN` from `react-native-worklets` to bridge back to the React thread (see `src/components/animated-icon.tsx` for the pattern).

## Domain: Guitar Tuner

This app is a lightweight guitar tuner. Key audio/tuning concerns:
- Microphone input requires the `expo-av` or `expo-audio` permission flow — always request at the point of use, not on launch.
- Pitch detection should run off the main thread (worklet or native module) to avoid dropped frames.
- Standard guitar tuning: E2 (82.4 Hz), A2 (110 Hz), D3 (146.8 Hz), G3 (196 Hz), B3 (246.9 Hz), E4 (329.6 Hz).
- Cent deviation from target frequency drives the tuner needle UI.
