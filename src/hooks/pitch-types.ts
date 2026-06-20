import type { PitchReading } from '@/lib/pitch';

export type MicPermission = 'undetermined' | 'granted' | 'denied';

export type PitchState = {
  /** Latest confident reading, or `null` when silent/unclear. */
  reading: PitchReading | null;
  /** Microphone permission status. */
  permission: MicPermission;
  /** Whether the microphone is actively streaming. */
  isListening: boolean;
  /** Prompt for microphone access (and start listening once granted). */
  requestPermission: () => Promise<void>;
};

/** Audio capture settings shared by every platform. */
export const SAMPLE_RATE = 44100;
/** How often (ms) the native recorder emits a chunk of samples. */
export const STREAM_INTERVAL_MS = 100;
