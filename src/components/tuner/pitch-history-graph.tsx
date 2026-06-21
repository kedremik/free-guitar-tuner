import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { IN_TUNE_CENTS } from '@/lib/pitch';
import { View } from '@/tw';

import { TUNER_COLORS, statusColor } from './palette';
import type { TuningStatus } from './status';

const RANGE = 50;

/**
 * Strip-chart of recent cent deviations — a scrolling trace of how the note has
 * drifted over the last few seconds. The centre line is perfect pitch, the green
 * band is the in-tune "good range", and gaps appear where the signal dropped.
 * The fixed-length `history` is the cutoff: old samples scroll off the left.
 */
export function PitchHistoryGraph({
  history,
  status,
  height = 92,
}: {
  history: (number | null)[];
  status: TuningStatus;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const mid = height / 2;
  const pad = 8;
  const n = history.length;
  const toX = (i: number) => (n > 1 ? (i / (n - 1)) * width : 0);
  const toY = (c: number) => mid - (Math.max(-RANGE, Math.min(RANGE, c)) / RANGE) * (mid - pad);

  // Split into continuous segments, breaking wherever the signal was silent.
  const segments: string[][] = [];
  let current: string[] = [];
  history.forEach((c, i) => {
    if (c == null) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(`${toX(i).toFixed(1)},${toY(c).toFixed(1)}`);
    }
  });
  if (current.length > 1) segments.push(current);

  let lastIdx = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (history[i] != null) {
      lastIdx = i;
      break;
    }
  }

  return (
    <View className="w-full" style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* In-tune band + perfect-pitch centre line */}
          <Rect
            x={0}
            y={toY(IN_TUNE_CENTS)}
            width={width}
            height={toY(-IN_TUNE_CENTS) - toY(IN_TUNE_CENTS)}
            fill={TUNER_COLORS.goodRange}
            rx={4}
          />
          <Line x1={0} y1={mid} x2={width} y2={mid} stroke={TUNER_COLORS.track} strokeWidth={1} />

          {segments.map((pts, idx) => (
            <Polyline
              key={idx}
              points={pts.join(' ')}
              fill="none"
              stroke={TUNER_COLORS.idle}
              strokeOpacity={0.9}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {lastIdx >= 0 && (
            <Circle cx={toX(lastIdx)} cy={toY(history[lastIdx] as number)} r={3.5} fill={statusColor(status)} />
          )}
        </Svg>
      )}
    </View>
  );
}
