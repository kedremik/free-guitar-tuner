import { Pressable, Text, View } from '@/tw';

/** Shown when microphone access was denied, with a button to open Settings. */
export function PermissionGate({ onRequest }: { onRequest: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-10">
      <Text className="text-center font-rounded text-2xl font-bold text-sf-text">
        Microphone access needed
      </Text>
      <Text className="text-center text-base leading-6 text-sf-text-2">
        The tuner listens to your guitar to detect pitch. Enable microphone access in Settings to
        start tuning. Audio is processed entirely on your device and never leaves it.
      </Text>
      <Pressable
        onPress={onRequest}
        className="mt-2 rounded-full bg-sf-text px-6 py-3 active:opacity-70"
      >
        <Text className="font-rounded text-base font-semibold text-sf-bg">Open Settings</Text>
      </Pressable>
    </View>
  );
}
