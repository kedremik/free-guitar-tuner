import type { SharedValue } from 'react-native-reanimated';

import type { PitchReading } from '@/lib/pitch';

export type MicPermission = 'undetermined' | 'granted' | 'denied';

export type PitchState = {
  /**
   * Latest reading, or `null` when silent/unclear. Throttled to a UI-friendly
   * rate (see `UI_UPDATE_INTERVAL_MS`) for text — the note name, cents number,
   * and string indicator don't need 50 Hz.
   */
  reading: PitchReading | null;
  /**
   * Cents-off updated on every analysis (full rate) as a Reanimated shared
   * value, so the dial needle animates on the UI thread without triggering a
   * React re-render. `null` when there is no confident pitch.
   */
  cents: SharedValue<number | null>;
  /** Microphone permission status. */
  permission: MicPermission;
  /** Whether the microphone is actively streaming. */
  isListening: boolean;
  /** Prompt for microphone access (and start listening once granted). */
  requestPermission: () => Promise<void>;
};

/** Audio capture settings shared by every platform. */
export const SAMPLE_RATE = 44100;
/** How often (ms) the native recorder emits a chunk of samples (≈50 Hz). */
export const STREAM_INTERVAL_MS = 20;
/**
 * Minimum gap between React state (text) updates. The needle and history read
 * the full-rate shared value directly, so the heavy re-render path only needs a
 * readable text cadence (~14 Hz) — this is the main lever against the audio
 * thread starving (see issue #6).
 */
export const UI_UPDATE_INTERVAL_MS = 70;
