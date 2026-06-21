# CLAUDE.md

Cross-platform guitar tuner — Expo SDK 56. Primary targets **iOS + Android** (web
enabled, no test runner). This file is a map, not a manual: it points to the
sources of truth and lists the invariants that must hold. Keep it short; when a
fact here is wrong or you learn a better command, fix it.

## Start here (sources of truth)

- `README.md` — how the app works (audio → pitch detection → UI pipeline),
  architecture, and the full file map. Read it before changing tuner behavior.
- `src/lib/pitch/` — pitch math + detection (`PitchTracker`, notes, PCM decode).
- `src/hooks/use-pitch.ts` / `use-pitch.web.ts` — mic capture, split by platform.
- `src/constants/theme.ts` — design tokens. Component prop types live with the
  component (e.g. `src/components/themed-text.tsx`, `themed-view.tsx`).
- Verify any new Expo API against versioned docs before using it:
  <https://docs.expo.dev/versions/v56.0.0/>

## Commands

```bash
pnpm install / pnpm start / pnpm ios / pnpm android / pnpm web / pnpm lint
```

The mic is a native module, so device targets need a **dev build** (not Expo Go).

## Invariants

- **pnpm only.** Dependency pins go in `pnpm.overrides` (npm `overrides`/`resolutions`
  are ignored). `.npmrc` keeps `node-linker=hoisted` for Metro/autolinking.
- **Styling:** NativeWind `className` via the `@/tw` wrappers; do not add
  `StyleSheet.create`. Reanimated elements need the `@/tw/animated` wrappers for
  `className` to apply.
- **React Compiler is on** — no manual `useMemo`/`useCallback` unless profiling
  proves it's needed.
- Platform forks use `.web.tsx` / `.web.ts` suffixes.
- Request mic permission at point of use, not on launch.
- Ship full implementations — no stubs, placeholders, or TODO-shaped code.

## Versioning & release notes

- `.env.build` holds the internal version: `BUILD_MAJOR` / `BUILD_MINOR`.
- **Major** = extensive overhaul (reset minor to 0). **Minor** = a new feature
  or patch. Bug fixes and small tweaks do **not** bump — they ride the current
  version.
- Record every change in `ReleaseNotes.md` under its version (newest on top). When
  you bump `.env.build`, add the matching heading there.

## Gotchas

- `lightningcss` is pinned to `1.30.1` (`pnpm.overrides`). Newer versions break
  NativeWind v5 preview + react-native-css **native** bundling
  (`failed to deserialize … Specifier`). Web bundling hides it, so validate CSS
  changes with `npx expo export --platform ios`.
- Reanimated worklets must be `'worklet'` and bridge to React via `scheduleOnRN`
  from `react-native-worklets` (see `src/components/animated-icon.tsx`).
