# Release Notes

Patch notes for Free Guitar Tuner. The internal version lives in `.env.build`
(`BUILD_MAJOR.BUILD_MINOR`); see CLAUDE.md for how versions are bumped. Newest on
top.

## 1.1

### Added

- **Real-time tuning dial** — a semicircular gauge whose needle glides to the
  current cent deviation, with ticks every 10 cents and a green "good range" band
  (±5 cents).
- **Pitch history graph** — a scrolling strip-chart of the last few seconds of
  cent deviation, so you can see how the note drifts as the string rings. The
  fixed time window is the cutoff; older samples scroll off.

### Changed

- Pitch tracker now uses a rolling analysis window (instead of fixed blocks), the
  native mic streams at ~20 ms, and smoothing/animation were tightened — so the
  dial tracks the pitch at ~50 updates/sec with minimal lag. The old horizontal
  snapshot meter was replaced by the dial.
- Onset detection: a pluck louder than the currently tracked level flushes the
  decaying previous note and re-acquires the new one immediately, instead of
  staying latched until the old string dies out.

### Performance

- Pitch detection now computes the McLeod autocorrelation via **FFT** (`fft.js`)
  instead of a direct O(n²) NSDF — ~20× faster per analysis (~2 ms → ~0.1 ms at
  a 2048-sample window). This frees the JS thread and reduces audio-thread load.
  Dropped the `pitchfinder` dependency. (Partially addresses #4 / #6.)

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
