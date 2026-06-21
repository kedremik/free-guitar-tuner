import Animated, {
  type SharedValue,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { IN_TUNE_CENTS } from '@/lib/pitch';
import { View } from '@/tw';

import { TUNER_COLORS, statusColor } from './palette';
import type { TuningStatus } from './status';

const AnimatedG = Animated.createAnimatedComponent(G);

/** Cents shown from the left edge of the dial to the right edge. */
const RANGE = 50;
const TICK_CENTS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

/** Map a cent value to a needle angle in degrees (0° = straight up). */
function toAngle(cents: number): number {
  return (Math.max(-RANGE, Math.min(RANGE, cents)) / RANGE) * 90;
}

/** Point on the gauge circle for a given angle (0° = top, +clockwise). */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** A polyline approximating the arc between two angles (avoids SVG arc-flag math). */
function arcPoints(cx: number, cy: number, r: number, from: number, to: number, steps = 64): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = polar(cx, cy, r, from + ((to - from) * i) / steps);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(' ');
}

/**
 * Semicircular tuner dial. A needle glides (real-time) to the current cent
 * deviation; ticks mark every 10 cents and a green band marks the in-tune
 * "good range" (±5 cents). At rest the needle returns to center, in grey.
 *
 * `cents` is a Reanimated shared value updated at the full analysis rate, so the
 * needle animates entirely on the UI thread — moving the dial off React's
 * re-render path (issue #6). The component itself only re-renders when `status`
 * (the needle colour) changes, at the throttled text rate.
 */
export function TunerDial({
  cents,
  status,
  size = 264,
}: {
  cents: SharedValue<number | null>;
  status: TuningStatus;
  size?: number;
}) {
  const stroke = Math.round(size * 0.045);
  const cx = size / 2;
  const r = cx - size * 0.1;
  const cy = r + stroke;
  const height = Math.round(cy + stroke * 2.5);
  const accent = statusColor(status);
  const goodDeg = toAngle(IN_TUNE_CENTS);
  const needleLen = r - stroke;
  const base = size * 0.018;

  // Derive the needle angle from the shared value on the UI thread, with a short
  // tween for smoothness. No React state, so no re-render as the pitch moves.
  const angle = useDerivedValue(() => {
    const c = cents.value;
    const clamped = c == null ? 0 : Math.max(-RANGE, Math.min(RANGE, c));
    return withTiming((clamped / RANGE) * 90, { duration: 60 });
  });
  const needleProps = useAnimatedProps(() => ({ rotation: angle.value }));

  const flat = polar(cx, cy, r + stroke * 1.5, -90);
  const sharp = polar(cx, cy, r + stroke * 1.5, 90);

  return (
    <View style={{ width: size, height }}>
      <Svg width={size} height={height}>
        {/* Track */}
        <Polyline
          points={arcPoints(cx, cy, r, -90, 90)}
          fill="none"
          stroke={TUNER_COLORS.track}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* In-tune "good range" band */}
        <Polyline
          points={arcPoints(cx, cy, r, -goodDeg, goodDeg)}
          fill="none"
          stroke={TUNER_COLORS.inTune}
          strokeOpacity={0.55}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Ticks every 10 cents (0 emphasized) */}
        {TICK_CENTS.map((c) => {
          const deg = toAngle(c);
          const inner = polar(cx, cy, r - stroke, deg);
          const outer = polar(cx, cy, r + stroke * 0.45, deg);
          const major = c === 0;
          return (
            <Line
              key={c}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={major ? TUNER_COLORS.idle : TUNER_COLORS.track}
              strokeWidth={major ? 3 : 2}
              strokeLinecap="round"
            />
          );
        })}
        {/* Flat / sharp end markers */}
        <SvgText x={flat.x} y={flat.y} fill={TUNER_COLORS.idle} fontSize={size * 0.07} textAnchor="middle">
          ♭
        </SvgText>
        <SvgText x={sharp.x} y={sharp.y} fill={TUNER_COLORS.idle} fontSize={size * 0.07} textAnchor="middle">
          ♯
        </SvgText>
        {/* Needle */}
        <AnimatedG animatedProps={needleProps} origin={`${cx}, ${cy}`}>
          <Polygon
            points={`${cx - base},${cy} ${cx + base},${cy} ${cx},${cy - needleLen}`}
            fill={accent}
          />
        </AnimatedG>
        <Circle cx={cx} cy={cy} r={base * 1.7} fill={accent} />
      </Svg>
    </View>
  );
}
