import { useEffect } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { View, useCSSVariable } from '@/tw';
import { Animated } from '@/tw/animated';

import { STATUS_COLOR_VAR, type TuningStatus } from './status';

/** Cents shown from edge to edge of the meter. */
const RANGE = 50;
const NEEDLE_WIDTH = 4;
const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

/**
 * Horizontal cent meter: a center-anchored scale with a needle that glides to
 * the detected deviation. Green in the middle "in-tune" band, red at the edges.
 */
export function TunerMeter({ cents, status }: { cents: number | null; status: TuningStatus }) {
  const width = useSharedValue(0);
  const target = useSharedValue(0);
  const color = useCSSVariable(STATUS_COLOR_VAR[status]);
  const inTuneColor = useCSSVariable('--tuner-in-tune');

  useEffect(() => {
    target.value = withTiming(cents ?? 0, { duration: 90 });
  }, [cents, target]);

  const onLayout = (event: LayoutChangeEvent) => {
    width.value = event.nativeEvent.layout.width;
  };

  const needleStyle = useAnimatedStyle(() => {
    const clamped = Math.max(-RANGE, Math.min(RANGE, target.value));
    const x = ((clamped + RANGE) / (2 * RANGE)) * width.value;
    return { transform: [{ translateX: x - NEEDLE_WIDTH / 2 }] };
  });

  return (
    <View className="w-full gap-3">
      {/* In-tune target band + tick scale */}
      <View className="h-20 w-full justify-center" onLayout={onLayout}>
        <View className="absolute left-1/2 h-20 w-12 -translate-x-1/2 rounded-2xl bg-tuner-in-tune/10" />

        <View className="h-12 w-full flex-row items-center justify-between">
          {TICKS.map((tick) => (
            <View
              key={tick}
              className={
                tick === 0
                  ? 'h-12 w-0.5 rounded-full bg-sf-text-2'
                  : tick % 50 === 0
                    ? 'h-8 w-px rounded-full bg-sf-separator'
                    : 'h-5 w-px rounded-full bg-sf-separator'
              }
            />
          ))}
        </View>

        {/* The needle */}
        <Animated.View
          className="absolute left-0 top-0 h-20 rounded-full"
          style={[
            needleStyle,
            {
              width: NEEDLE_WIDTH,
              backgroundColor: cents == null ? undefined : color,
            },
          ]}
        >
          {cents == null && <View className="h-20 w-full rounded-full bg-tuner-idle/40" />}
        </Animated.View>
      </View>

      {/* Flat / In tune / Sharp labels */}
      <View className="w-full flex-row justify-between px-1">
        <Label text="♭ Flat" active={status === 'flat'} color={color} />
        <Label text="In Tune" active={status === 'in-tune'} color={inTuneColor} />
        <Label text="Sharp ♯" active={status === 'sharp'} color={color} />
      </View>
    </View>
  );
}

function Label({ text, active, color }: { text: string; active: boolean; color: string }) {
  return (
    <Animated.Text
      className="text-xs font-rounded font-semibold"
      style={{ color: active ? color : undefined, opacity: active ? 1 : 0.35 }}
    >
      {text}
    </Animated.Text>
  );
}
