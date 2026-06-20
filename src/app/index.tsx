import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoteDisplay } from '@/components/tuner/note-display';
import { PermissionGate } from '@/components/tuner/permission-gate';
import { tuningStatus } from '@/components/tuner/status';
import { StringRow } from '@/components/tuner/string-row';
import { TunerMeter } from '@/components/tuner/tuner-meter';
import { BottomTabInset } from '@/constants/theme';
import { usePitch } from '@/hooks/use-pitch';
import { Text, View } from '@/tw';

export default function TunerScreen() {
  const insets = useSafeAreaInsets();
  const { reading, permission, requestPermission } = usePitch();
  const status = tuningStatus(reading?.cents);

  return (
    <View
      className="flex-1 bg-sf-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + BottomTabInset }}
    >
      {permission === 'denied' ? (
        <PermissionGate onRequest={requestPermission} />
      ) : (
        <View className="flex-1 items-center justify-between px-6 py-8">
          <View className="items-center gap-1 pt-2">
            <Text className="font-rounded text-lg font-semibold text-sf-text">Guitar Tuner</Text>
            <Text className="text-sm text-sf-text-2">Standard Tuning · E A D G B E</Text>
          </View>

          <View className="w-full items-center gap-12">
            <NoteDisplay reading={reading} status={status} />
            <TunerMeter cents={reading?.cents ?? null} status={status} />
          </View>

          <StringRow reading={reading} />
        </View>
      )}
    </View>
  );
}
