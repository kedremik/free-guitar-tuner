import { type PitchReading, STANDARD_TUNING } from '@/lib/pitch';
import { cn } from '@/lib/cn';
import { Text, View } from '@/tw';

/**
 * The six open strings of standard tuning. The string closest to the current
 * pitch lights up so the player knows which peg they're working on.
 */
export function StringRow({ reading }: { reading: PitchReading | null }) {
  const activeMidi = reading?.string.midi;

  return (
    <View className="w-full flex-row justify-between">
      {STANDARD_TUNING.map((string) => {
        const active = string.midi === activeMidi;
        return (
          <View key={string.note} className="items-center gap-1.5">
            <View
              className={cn(
                'h-12 w-12 items-center justify-center rounded-full',
                active ? 'bg-sf-text' : 'bg-sf-bg-2',
              )}
            >
              <Text
                className={cn(
                  'font-rounded text-lg font-semibold',
                  active ? 'text-sf-bg' : 'text-sf-text-2',
                )}
              >
                {string.label}
              </Text>
            </View>
            <Text className="text-[11px] text-sf-text-2">{string.note}</Text>
          </View>
        );
      })}
    </View>
  );
}
