# 🎸 Free Guitar Tuner

A sleek, minimal chromatic guitar tuner for **iOS and Android** (with a working web
build), styled like an Apple product. The microphone stays live the whole time the
app is open: pluck a string and the app instantly shows the nearest note, which
open string you're closest to, and how many cents you are sharp or flat — with a
needle that glides to the center as you get in tune.

All audio is analyzed **on-device**. Nothing is recorded, stored, or uploaded.

---

## How it works

The tuner is a small pipeline that turns a live microphone signal into a single
"how in-tune am I" answer:

```text
 mic ──► Float32 samples ──► PitchTracker ──► PitchReading ──► UI
 (per platform)            (window→gate→detect→         (note, octave,
                            range-check→smooth)          cents, string)
```

### 1. Capturing audio (always-on mic)

Getting raw audio samples differs per platform, so the capture layer is the only
platform-specific piece. Both implementations expose the **same `usePitch()` hook**
(`src/hooks/use-pitch.ts` for native, `src/hooks/use-pitch.web.ts` for web), so the
rest of the app never knows which one is running:

| Platform | Source | How samples arrive |
| --- | --- | --- |
| iOS / Android | [`@siteed/expo-audio-studio`](https://github.com/deeeed/audiolab) | Streams raw 16-bit PCM chunks (~100 ms) which are decoded to Float32 in `src/lib/pitch/decode-pcm.ts` |
| Web | Web Audio API (`AnalyserNode`) | `getFloatTimeDomainData` reads a 2048-sample window each animation frame |

The hook requests microphone permission at the point of use, starts streaming as
soon as it's granted, and keeps the mic open until the screen unmounts.

### 2. Detecting the pitch

Detection runs through the **McLeod Pitch Method** (MPM) — the same
normalized-autocorrelation approach used by hardware tuners like Tartini. It's
accurate for a single (monophonic) instrument and conveniently returns a *clarity*
probability used to reject noise. Our implementation (`src/lib/pitch/mpm.ts`)
computes the autocorrelation via **FFT** ([`fft.js`](https://github.com/indutny/fft.js)),
making each analysis ~20× cheaper than a direct O(n²) NSDF — fast enough to run
~50×/s in real time without starving the audio thread.

`PitchTracker` (`src/lib/pitch/tracker.ts`) wraps the raw detector to make it usable
on a live stream:

1. **Buffering** — incoming chunks are collected into a fixed 2048-sample analysis
   window (≈46 ms at 44.1 kHz, long enough to resolve the low E2 string).
2. **Noise gating** — windows below an RMS threshold are treated as silence; a
   detector probability below 0.9 is rejected as unclear.
3. **Range check** — only fundamentals between ~70 Hz and ~520 Hz (a guitar's
   plausible range) are accepted, which throws out octave errors and hum.
4. **Smoothing** — the last few estimates are median-filtered so the needle is
   stable instead of jittery.

### 3. From frequency to a musical answer

All the music theory lives in `src/lib/pitch/notes.ts`, derived from equal
temperament with A4 = 440 Hz:

- **Nearest note** — `midi = round(69 + 12·log2(f / 440))`, then mapped to a note
  name + octave.
- **Cents off** — `cents = 1200·log2(f / nearestNoteFrequency)`, clamped to ±50.
  Within **±5 cents** the note is considered *in tune*.
- **Which string** — the standard-tuning string (E2 A2 D3 G3 B3 E4) whose target
  frequency is closest, in cents, to the detected pitch.

The result is a single `PitchReading` object consumed by the UI.

---

## Layout

A two-tab app (native tabs on device, a top tab bar on web):

- **Tuner** (`src/app/index.tsx`) — the main screen, laid out top-to-bottom:
  - **Note display** — the big nearest-note letter + octave, with frequency and
    cents underneath. The letter turns green when in tune.
  - **Cent meter** (`src/components/tuner/tuner-meter.tsx`) — a horizontal scale
    with a needle that animates (Reanimated) to your deviation; a soft green band
    marks the in-tune zone, and the needle is green in the center, red at the edges.
  - **String row** — the six open strings; the one you're closest to lights up.
- **Guide** (`src/app/explore.tsx`) — how to use it, the standard-tuning reference
  table, and a short note on what "cents" means.

If microphone access is denied, the Tuner shows a `PermissionGate` with a retry
button instead.

---

## Architecture / file map

```text
src/
├─ app/
│  ├─ index.tsx            Tuner screen
│  └─ explore.tsx          Guide screen
├─ hooks/
│  ├─ pitch-types.ts       Shared PitchState type + audio constants
│  ├─ use-pitch.ts         Native mic capture (expo-audio-studio)
│  └─ use-pitch.web.ts     Web mic capture (Web Audio API)
├─ lib/
│  ├─ cn.ts                Tailwind class-merge helper
│  └─ pitch/
│     ├─ notes.ts          Note/cents math + standard tuning
│     ├─ tracker.ts        PitchTracker: window, gate, detect, smooth
│     ├─ decode-pcm.ts     base64 16-bit PCM → Float32
│     └─ index.ts          Barrel export
├─ components/tuner/
│  ├─ note-display.tsx     Big note + octave + frequency
│  ├─ tuner-meter.tsx      Animated cent needle + scale
│  ├─ string-row.tsx       Six-string indicator
│  ├─ permission-gate.tsx  Mic-denied fallback
│  └─ status.ts            cents → 'in-tune' | 'flat' | 'sharp'
└─ tw/                     NativeWind-wrapped View/Text/etc. (className support)
```

### Tech stack

- **Expo SDK 56** + Expo Router (file-based, typed routes), React 19, React Native 0.85
- **NativeWind v5 / Tailwind CSS v4** for styling (`className`), with Apple system
  colors (`platformColor` on iOS, `light-dark()` elsewhere) defined in
  `src/global.css`
- **Reanimated 4** for the needle animation
- **FFT-accelerated McLeod Pitch Method** (`src/lib/pitch/mpm.ts`, using `fft.js`) for pitch detection
- **@siteed/expo-audio-studio** for native real-time PCM streaming

---

## Getting started

This project uses **pnpm**.

```bash
pnpm install
```

The microphone uses a native module, so it needs a **development build** (it won't
run in Expo Go):

```bash
pnpm ios       # build & run on iOS
pnpm android   # build & run on Android
pnpm web       # run in the browser (Web Audio API)
pnpm lint      # eslint
```

> On the first native run, Expo will prebuild the iOS/Android projects and wire up
> the microphone permission and the `@siteed/audio-studio` config plugin
> (see `app.json`). The app is **dev-build only** — Expo Go can't load the native
> mic module. Note the iOS Simulator has no microphone input, so test pitch
> detection on a real device (or use `pnpm web`).

---

## Notes & limitations

- Tuned for **standard tuning** (E A D G B E). The chromatic note detection works
  for any pitch in range, but the highlighted "string" assumes standard tuning.
- Designed for a single plucked note at a time (monophonic), like every guitar
  tuner — strumming a full chord won't give a meaningful reading.
- Best results come from a clear single string in a reasonably quiet room.
