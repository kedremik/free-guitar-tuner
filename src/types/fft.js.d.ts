declare module 'fft.js' {
  /** Minimal typings for the parts of fft.js we use. */
  export default class FFT {
    constructor(size: number);
    readonly size: number;
    createComplexArray(): number[];
    realTransform(out: number[], data: ArrayLike<number>): void;
    completeSpectrum(spectrum: number[]): void;
    inverseTransform(out: number[], data: number[]): void;
    transform(out: number[], data: number[]): void;
  }
}
