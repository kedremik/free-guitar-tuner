import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Rolling time-series of cent deviations for the history graph. Samples the
 * full-rate `cents` shared value at a fixed cadence (independent of the throttled
 * React reading) so the trace scrolls smoothly, and caps it at `size` points —
 * that fixed window is the "cutoff", since a ringing string always drifts out of
 * tune eventually.
 *
 * Each slot is the cents-off value, or `null` for silence (a gap in the line).
 */
export function usePitchHistory(
  cents: SharedValue<number | null>,
  { size = 160, intervalMs = 33 }: { size?: number; intervalMs?: number } = {},
): (number | null)[] {
  const [history, setHistory] = useState<(number | null)[]>(() => new Array(size).fill(null));

  useEffect(() => {
    const id = setInterval(() => {
      // Read the shared value here (in the timer callback), not inside the
      // setState updater — React runs updaters during render, and reading a
      // shared value's `.value` during render trips Reanimated's strict mode.
      const current = cents.value;
      setHistory((prev) => {
        const next = prev.slice(1);
        next.push(current);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [cents, size, intervalMs]);

  return history;
}
