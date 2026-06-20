import { type PitchReading } from '@/lib/pitch';
import { Text, View, useCSSVariable } from '@/tw';

import { STATUS_COLOR_VAR, type TuningStatus } from './status';

/** The big centerpiece: nearest note name, octave, frequency and cents. */
export function NoteDisplay({
  reading,
  status,
}: {
  reading: PitchReading | null;
  status: TuningStatus;
}) {
  const color = useCSSVariable(STATUS_COLOR_VAR[status]);

  if (!reading) {
    return (
      <View className="items-center gap-2">
        <Text className="font-rounded text-[120px] font-bold leading-none text-tuner-idle">–</Text>
        <Text className="text-base text-sf-text-2">Play a string to begin</Text>
      </View>
    );
  }

  const cents = Math.round(reading.cents);
  const centsLabel = `${cents > 0 ? '+' : ''}${cents}¢`;

  return (
    <View className="items-center gap-2">
      <View className="flex-row items-start">
        <Text
          className="font-rounded text-[120px] font-bold leading-none text-sf-text"
          style={{ color }}
        >
          {reading.note}
        </Text>
        <Text className="mt-3 font-rounded text-4xl font-semibold text-sf-text-2">
          {reading.octave}
        </Text>
      </View>
      <Text className="font-mono text-base text-sf-text-2">
        {centsLabel} · {reading.frequency.toFixed(1)} Hz
      </Text>
    </View>
  );
}
