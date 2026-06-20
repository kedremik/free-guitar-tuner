/**
 * Music-theory helpers for the tuner. Everything is derived from the equal
 * temperament formula with A4 = 440 Hz as the reference pitch:
 *
 *   frequency(midi) = 440 * 2^((midi - 69) / 12)
 *
 * MIDI note numbers give us a clean integer index for every note, which makes
 * "nearest note" and "cents off" trivial to compute.
 */

export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
] as const;

export type GuitarString = {
  /** Letter shown in the UI, e.g. "E". */
  label: string;
  /** Scientific pitch notation, e.g. "E2". */
  note: string;
  /** MIDI note number. */
  midi: number;
  /** Target frequency in Hz. */
  frequency: number;
};

export function frequencyForMidi(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

/** Nearest MIDI note number to a frequency (may be fractional before rounding). */
export function midiFromFrequency(frequency: number): number {
  return A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY);
}

export function noteNameForMidi(midi: number): { name: string; octave: number } {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { name, octave };
}

/** Signed cent difference: how far `frequency` sits above/below `reference`. */
export function centsBetween(frequency: number, reference: number): number {
  return 1200 * Math.log2(frequency / reference);
}

/**
 * Standard guitar tuning, low (6th) to high (1st) string.
 * E2, A2, D3, G3, B3, E4.
 */
export const STANDARD_TUNING: GuitarString[] = [40, 45, 50, 55, 59, 64].map((midi) => {
  const { name, octave } = noteNameForMidi(midi);
  return { label: name, note: `${name}${octave}`, midi, frequency: frequencyForMidi(midi) };
});

/** The standard-tuning string whose target pitch is closest to `frequency`. */
export function nearestString(frequency: number): GuitarString {
  return STANDARD_TUNING.reduce((best, string) =>
    Math.abs(centsBetween(frequency, string.frequency)) <
    Math.abs(centsBetween(frequency, best.frequency))
      ? string
      : best,
  );
}

export type PitchReading = {
  /** Detected fundamental frequency in Hz. */
  frequency: number;
  /** Nearest note name in the chromatic scale, e.g. "E". */
  note: string;
  /** Octave of the nearest note. */
  octave: number;
  /** Cents away from the nearest chromatic note, clamped to [-50, 50]. */
  cents: number;
  /** Closest string in standard tuning. */
  string: GuitarString;
  /** Detector confidence, 0–1. */
  clarity: number;
};

/** Turn a raw frequency into a fully-resolved reading for the UI. */
export function readingFromFrequency(frequency: number, clarity: number): PitchReading {
  const nearestMidi = Math.round(midiFromFrequency(frequency));
  const { name, octave } = noteNameForMidi(nearestMidi);
  const cents = centsBetween(frequency, frequencyForMidi(nearestMidi));
  return {
    frequency,
    note: name,
    octave,
    cents: Math.max(-50, Math.min(50, cents)),
    string: nearestString(frequency),
    clarity,
  };
}

/** ±5 cents is the threshold most tuners treat as "in tune". */
export const IN_TUNE_CENTS = 5;
/** Within ±15 cents the note is close but still flat/sharp. */
export const CLOSE_CENTS = 15;
