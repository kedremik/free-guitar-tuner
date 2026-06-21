# Release Notes

Patch notes for Free Guitar Tuner. The internal version lives in `.env.build`
(`BUILD_MAJOR.BUILD_MINOR`); see CLAUDE.md for how versions are bumped. Newest on
top.

## 1.0

Initial release.

### Added

- Cross-platform guitar tuner (iOS, Android, web): always-on microphone, McLeod
  (MPM) pitch detection, nearest-note display, animated cents meter, and a
  standard-tuning string indicator.
- Tuner and Guide screens, styled with NativeWind / Tailwind and Apple system
  colors.

### Changed

- Project standardized on **pnpm** (`pnpm.overrides`, `node-linker=hoisted`).
- Added a GitHub Actions CI pipeline: lint, typecheck, and web + native bundle
  export.
- Native runs now build a development client (`expo run:ios` / `expo run:android`)
  instead of launching Expo Go, which can't load the native microphone module.

### Fixed

- iOS microphone permission is now requested on first launch — previously the app
  stayed `undetermined` and never opened the mic. A denied state now routes the
  user to Settings.
