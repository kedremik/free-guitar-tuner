# CLAUDE.md

- **Expo SDK 56** — read versioned docs at <https://docs.expo.dev/versions/v56.0.0/> before writing code
- Primary targets: **iOS and Android** (web enabled, no test runner)

## Commands

```bash
npm start / npm run ios / npm run android / npm run lint
```

## Structure

- Source in `src/` — aliases: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- Routes in `src/app/` (Expo Router, typed routes). Platform-specific files use `.web.tsx`/`.web.ts` suffix
- React Compiler enabled — no manual `useMemo`/`useCallback` unless profiling shows need

## Styling

- **NativeWind** — use `className` prop, never `StyleSheet.create`
- Design tokens in `src/constants/theme.ts` (`Colors`, `Fonts`, `Spacing`, etc.) — prefer Tailwind classes that map to these

## Theming

- `useTheme()` (`src/hooks/use-theme.ts`) → active `Colors.light` / `Colors.dark`
- `ThemedText` types: `'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code'`; optional `themeColor` to override
- `ThemedView` type: `'background' | 'backgroundElement' | 'backgroundSelected'`

## Navigation

- Root layout (`src/app/_layout.tsx`): `ThemeProvider` → `AppTabs`
- Native: `NativeTabs` from `expo-router/unstable-native-tabs`; Web: `Tabs`/`TabList`/`TabTrigger` from `expo-router/ui`

## Animations

- Reanimated 4.x `Keyframe` API; worklets must be `'worklet'` and use `scheduleOnRN` from `react-native-worklets` to bridge to React thread (see `src/components/animated-icon.tsx`)

## Domain: Guitar Tuner

from `expo-router/unstable-native-tabs`; Web: `Tabs`/`TabList`/`TabTrigger` from `expo-router/ui`

## Animations

- Reanimated 4.x `Keyframe` API; worklets must be `'worklet'` and use `scheduleOnRN` from `react-native-worklets` to bridge to React thread (see `src/components/animated-icon.tsx`)

## Domain: Guitar Tuner

- Mic permission via `expo-av`/`expo-audio` — request at point of use, not on launch
- Pitch detection off main thread (worklet or native module)
- Standard tuning: E2 (82.4 Hz), A2 (110 Hz), D3 (146.8 Hz), G3 (196 Hz), B3 (246.9 Hz), E4 (329.6 Hz)
- Cent deviation from target frequency drives the tuner needle UI
