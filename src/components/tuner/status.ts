import { IN_TUNE_CENTS } from '@/lib/pitch';

export type TuningStatus = 'idle' | 'in-tune' | 'flat' | 'sharp';

/** Classify a cent deviation into a tuning status. `null` = no signal. */
export function tuningStatus(cents: number | null | undefined): TuningStatus {
  if (cents == null) return 'idle';
  if (Math.abs(cents) <= IN_TUNE_CENTS) return 'in-tune';
  return cents < 0 ? 'flat' : 'sharp';
}

/** CSS custom property holding the accent color for each status. */
export const STATUS_COLOR_VAR: Record<TuningStatus, string> = {
  idle: '--tuner-idle',
  'in-tune': '--tuner-in-tune',
  flat: '--tuner-off',
  sharp: '--tuner-off',
};
