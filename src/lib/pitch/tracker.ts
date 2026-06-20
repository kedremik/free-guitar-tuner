import { Macleod } from 'pitchfinder';

import { type PitchReading, readingFromFrequency } from './notes';

/**
 * Pitch detection is done with the McLeod Pitch Method (Macleod) — the same
 * normalized-autocorrelation approach used by hardware tuners like Tartini. It
 * is accurate for monophonic instruments and conveniently returns a clarity
 * (probability) value we can use to reject noise.
 *
 * `PitchTracker` adapts the raw detector for a live microphone stream:
 *  - buffers incoming samples into a fixed analysis window,
 *  - gates out silence/noise via RMS level and detector probability,
 *  - rejects frequencies outside a guitar's plausible range, and
 *  - median-smooths recent estimates so the needle doesn't jitter.
 */

export type TrackerOptions = {
  sampleRate: number;
  /** Analysis window in samples. 2048 ≈ 46 ms @ 44.1 kHz — enough for low E2. */
  bufferSize?: number;
  /** Minimum RMS level treated as a real signal (below this = silence). */
  rmsThreshold?: number;
  /** Minimum detector probability to trust a reading. */
  clarityThreshold?: number;
};

// A guitar's fundamentals live roughly between D#2 and a high fretted E5.
const MIN_FREQUENCY = 70;
const MAX_FREQUENCY = 520;
const SMOOTHING_WINDOW = 5;

export class PitchTracker {
  private readonly detect: ReturnType<typeof Macleod>;
  private readonly bufferSize: number;
  private readonly rmsThreshold: number;
  private readonly clarityThreshold: number;
  private readonly window: Float32Array;
  private filled = 0;
  private readonly history: number[] = [];

  constructor(options: TrackerOptions) {
    this.bufferSize = options.bufferSize ?? 2048;
    this.rmsThreshold = options.rmsThreshold ?? 0.01;
    this.clarityThreshold = options.clarityThreshold ?? 0.9;
    this.window = new Float32Array(this.bufferSize);
    this.detect = Macleod({ sampleRate: options.sampleRate, bufferSize: this.bufferSize });
  }

  /**
   * Feed a chunk of samples. Returns a reading once a full analysis window has
   * accumulated and a confident pitch is found, otherwise `null`.
   */
  process(samples: Float32Array): PitchReading | null {
    this.append(samples);
    if (this.filled < this.bufferSize) return null;

    const reading = this.analyze();
    this.filled = 0; // start the next window fresh
    return reading;
  }

  /** Drop buffered audio and smoothing history (e.g. when recording restarts). */
  reset() {
    this.filled = 0;
    this.history.length = 0;
  }

  private append(samples: Float32Array) {
    for (let i = 0; i < samples.length; i++) {
      if (this.filled >= this.bufferSize) {
        // Window full but not yet analyzed — keep the most recent samples.
        this.window.copyWithin(0, 1);
        this.window[this.bufferSize - 1] = samples[i];
      } else {
        this.window[this.filled++] = samples[i];
      }
    }
  }

  private analyze(): PitchReading | null {
    if (rms(this.window) < this.rmsThreshold) {
      this.history.length = 0;
      return null;
    }

    const { freq, probability } = this.detect(this.window);
    if (
      !freq ||
      probability < this.clarityThreshold ||
      freq < MIN_FREQUENCY ||
      freq > MAX_FREQUENCY
    ) {
      return null;
    }

    const smoothed = this.smooth(freq);
    return readingFromFrequency(smoothed, probability);
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
