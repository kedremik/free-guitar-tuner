import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useTuning } from '@/hooks/use-tuning';
import { ScrollView, Text, View } from '@/tw';

const STEPS = [
  'Allow microphone access — audio is analyzed on-device and never recorded or uploaded.',
  'Pluck a single open string and let it ring.',
  'The big note shows the closest pitch; the meter shows how flat or sharp you are.',
  'Turn the tuning peg until the needle sits in the green centre — that is ±5 cents, considered in tune.',
];

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const { tuning } = useTuning();

  return (
    <ScrollView
      className="flex-1 bg-sf-bg"
      contentContainerClassName="px-6 gap-8"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + BottomTabInset + 24 }}
    >
      <View className="gap-2">
        <Text className="font-rounded text-3xl font-bold text-sf-text">How it works</Text>
        <Text className="text-base leading-6 text-sf-text-2">
          A chromatic tuner that listens to your guitar, finds the fundamental frequency, and tells
          you the nearest note and how many cents you are away from it.
        </Text>
      </View>

      <View className="gap-4">
        {STEPS.map((step, index) => (
          <View key={index} className="flex-row gap-3">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-sf-bg-2">
              <Text className="font-rounded text-sm font-bold text-sf-text">{index + 1}</Text>
            </View>
            <Text className="flex-1 text-base leading-6 text-sf-text">{step}</Text>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <Text className="font-rounded text-xl font-bold text-sf-text">{tuning.name} tuning</Text>
        <View className="overflow-hidden rounded-2xl bg-sf-bg-2">
          {tuning.strings.map((string, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between px-4 py-3"
              style={index > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)' } : undefined}
            >
              <Text className="font-rounded text-base font-semibold text-sf-text">
                {6 - index} · {string.note}
              </Text>
              <Text className="font-mono text-sm text-sf-text-2">
                {string.frequency.toFixed(2)} Hz
              </Text>
            </View>
          ))}
        </View>
        <Text className="text-sm leading-5 text-sf-text-2">
          Cents are a logarithmic unit of pitch: 100 cents make a semitone, so ±5 cents is a very
          small, in-tune deviation.
        </Text>
      </View>
    </ScrollView>
  );
}
