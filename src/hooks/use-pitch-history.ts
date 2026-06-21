import { useEffect, useRef, useState } from 'react';

import type { PitchReading } from '@/lib/pitch';

/**
 * Rolling time-series of cent deviations for the history graph. Sampled at a
 * fixed cadence (independent of the detector's rate) so the trace scrolls
 * smoothly, and capped at `size` points — that fixed window is the "cutoff",
 * since a ringing string always drifts out of tune eventually.
 *
 * Each slot is the cents-off value, or `null` for silence (a gap in the line).
 */
export function usePitchHistory(
  reading: PitchReading | null,
  { size = 160, intervalMs = 33 }: { size?: number; intervalMs?: number } = {},
): (number | null)[] {
  const latest = useRef<number | null>(null);
  useEffect(() => {
    latest.current = reading?.cents ?? null;
  }, [reading]);

  const [history, setHistory] = useState<(number | null)[]>(() => new Array(size).fill(null));

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const next = prev.slice(1);
        next.push(latest.current);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [size, intervalMs]);

  return history;
}
