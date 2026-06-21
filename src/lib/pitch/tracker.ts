import { Macleod } from 'pitchfinder';

import { type PitchReading, readingFromFrequency } from './notes';

/**
 * Pitch detection is done with the McLeod Pitch Method (Macleod) — the same
 * normalized-autocorrelation approach used by hardware tuners like Tartini. It
 * is accurate for monophonic instruments and conveniently returns a clarity
 * (probability) value we can use to reject noise.
 *
 * `PitchTracker` adapts the raw detector for a live microphone stream:
 *  - keeps a rolling window of the most recent samples (so readings update in
 *    near real time as audio arrives, not once per fixed block),
 *  - re-acquires on onset: a sound louder than the tracked envelope (a fresh
 *    pluck) flushes the stale ringing so the new note registers immediately,
 *  - throttles analysis to a sane rate to bound CPU,
 *  - gates out silence/noise via RMS level and detector probability,
 *  - rejects frequencies outside a guitar's plausible range, and
 *  - median-smooths recent estimates so the needle doesn't jitter.
 *
 * `process` returns one of three things:
 *  - a `PitchReading` — a confident pitch,
 *  - `null` — analyzed, but silent/unclear (clear the display),
 *  - `undefined` — no new analysis this call (keep the previous reading).
 */

export type TrackerOptions = {
  sampleRate: number;
  /** Analysis window in samples. 2048 ≈ 46 ms @ 44.1 kHz — enough for low E2. */
  bufferSize?: number;
  /** Minimum RMS level treated as a real signal (below this = silence). */
  rmsThreshold?: number;
  /** Minimum detector probability to trust a reading. */
  clarityThreshold?: number;
  /** Don't run the detector more often than this (ms). Caps the web rAF loop;
   * native chunks already arrive at `STREAM_INTERVAL_MS`. */
  minIntervalMs?: number;
};

export type TrackerResult = PitchReading | null | undefined;

// A guitar's fundamentals live roughly between D#2 and a high fretted E5.
const MIN_FREQUENCY = 70;
const MAX_FREQUENCY = 520;
// Small median window: just enough to drop the odd octave-error spike without
// the lag that makes the needle feel sluggish. The dial's tween smooths the rest.
const SMOOTHING_WINDOW = 3;

// Onset detection: a new chunk this much louder than the tracked envelope is a
// fresh pluck. The envelope follows the signal and decays, so it represents
// "what's currently registered" — a louder attack beats it and re-acquires.
const ONSET_RATIO = 1.4;
const ONSET_DECAY = 0.92;
const ONSET_FLOOR = 0.01;

export class PitchTracker {
  private readonly detect: ReturnType<typeof Macleod>;
  private readonly bufferSize: number;
  private readonly rmsThreshold: number;
  private readonly clarityThreshold: number;
  private readonly minIntervalMs: number;
  private readonly buffer: Float32Array;
  private received = 0;
  private lastAnalysisAt = 0;
  private envelope = 0;
  private readonly history: number[] = [];

  constructor(options: TrackerOptions) {
    this.bufferSize = options.bufferSize ?? 2048;
    // Low gate so a decaying/ringing string keeps reading instead of snapping
    // back to centre the moment it gets quiet.
    this.rmsThreshold = options.rmsThreshold ?? 0.006;
    this.clarityThreshold = options.clarityThreshold ?? 0.9;
    this.minIntervalMs = options.minIntervalMs ?? 12;
    this.buffer = new Float32Array(this.bufferSize);
    this.detect = Macleod({ sampleRate: options.sampleRate, bufferSize: this.bufferSize });
  }

  /** Feed a chunk of samples; see the class doc for the return contract. */
  process(samples: Float32Array): TrackerResult {
    const level = rms(samples);

    // A sound louder than the current envelope is a new pluck — throw away the
    // stale ringing so the detector re-acquires the fresh, louder note instead
    // of fighting the decaying previous one.
    if (level > ONSET_FLOOR && level > this.envelope * ONSET_RATIO) {
      this.received = 0;
      this.buffer.fill(0);
      this.history.length = 0;
      this.lastAnalysisAt = 0;
    }
    // Peak-follow with decay: tracks the ringing note, but forgets it over ~1 s
    // so the next pluck (or a note after silence) reliably counts as an onset.
    this.envelope = Math.max(level, this.envelope * ONSET_DECAY);

    this.push(samples);
    if (this.received < this.bufferSize) return undefined;

    const now = Date.now();
    if (now - this.lastAnalysisAt < this.minIntervalMs) return undefined;
    this.lastAnalysisAt = now;

    return this.analyze();
  }

  /** Drop buffered audio and smoothing history (e.g. when recording restarts). */
  reset() {
    this.received = 0;
    this.lastAnalysisAt = 0;
    this.envelope = 0;
    this.history.length = 0;
    this.buffer.fill(0);
  }

  /** Append the newest samples to the tail of the rolling window. */
  private push(samples: Float32Array) {
    const n = samples.length;
    if (n === 0) return;
    if (n >= this.bufferSize) {
      this.buffer.set(samples.subarray(n - this.bufferSize));
    } else {
      this.buffer.copyWithin(0, n); // shift older samples toward the front
      this.buffer.set(samples, this.bufferSize - n); // newest at the end
    }
    this.received += n;
  }

  private analyze(): PitchReading | null {
    if (rms(this.buffer) < this.rmsThreshold) {
      this.history.length = 0;
      return null;
    }

    const { freq, probability } = this.detect(this.buffer);
    if (
      !freq ||
      probability < this.clarityThreshold ||
      freq < MIN_FREQUENCY ||
      freq > MAX_FREQUENCY
    ) {
      return null;
    }

    return readingFromFrequency(this.smooth(freq), probability);
  }

  private smooth(frequency: number): number {
    this.history.push(frequency);
    if (this.history.length > SMOOTHING_WINDOW) this.history.shift();
    const sorted = [...this.history].sort((a, b) => a - b);
    return sorted[sorted.length >> 1];
  }
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}
