import type { TuningStatus } from './status';

/**
 * Explicit color values for the SVG dial and history graph. SVG fill/stroke
 * props don't reliably accept `platformColor()`, so these mirror the tuner
 * palette in `global.css` as plain values.
 */
export const TUNER_COLORS = {
  inTune: '#30d158',
  off: '#ff453a',
  idle: '#8e8e93',
  /** Faint tick / track color. */
  track: 'rgba(120,120,128,0.30)',
  /** Green "good range" fill. */
  goodRange: 'rgba(48,209,88,0.16)',
};

export function statusColor(status: TuningStatus): string {
  switch (status) {
    case 'in-tune':
      return TUNER_COLORS.inTune;
    case 'flat':
    case 'sharp':
      return TUNER_COLORS.off;
    default:
      return TUNER_COLORS.idle;
  }
}
