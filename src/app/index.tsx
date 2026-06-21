import { Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoteDisplay } from '@/components/tuner/note-display';
import { PermissionGate } from '@/components/tuner/permission-gate';
import { PitchHistoryGraph } from '@/components/tuner/pitch-history-graph';
import { tuningStatus } from '@/components/tuner/status';
import { StringRow } from '@/components/tuner/string-row';
import { TunerDial } from '@/components/tuner/tuner-dial';
import { BottomTabInset } from '@/constants/theme';
import { usePitch } from '@/hooks/use-pitch';
import { usePitchHistory } from '@/hooks/use-pitch-history';
import { useTuning } from '@/hooks/use-tuning';
import { nearestString, tuningNotes } from '@/lib/pitch';
import { Text, View } from '@/tw';

export default function TunerScreen() {
  const insets = useSafeAreaInsets();
  const { reading, cents, permission, requestPermission } = usePitch();
  const { tuning } = useTuning();
  const status = tuningStatus(reading?.cents);
  const history = usePitchHistory(cents);

  // Which string of the *selected* tuning the current pitch is closest to.
  const activeMidi = reading ? nearestString(reading.frequency, tuning.strings).midi : null;

  // Once denied, iOS won't prompt again — the only way back is Settings (toggling
  // the mic there relaunches the app, so it picks up the grant on boot). On web,
  // re-requesting is the recoverable path.
  const onGatePress = Platform.OS === 'web' ? requestPermission : () => Linking.openSettings();

  return (
    <View
      className="flex-1 bg-sf-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + BottomTabInset }}
    >
      {permission === 'denied' ? (
        <PermissionGate onRequest={onGatePress} />
      ) : (
        <View className="flex-1 items-center justify-between px-6 py-6">
          <View className="items-center gap-1 pt-2">
            <Text className="font-rounded text-lg font-semibold text-sf-text">{tuning.name}</Text>
            <Text className="text-sm text-sf-text-2">{tuningNotes(tuning)}</Text>
          </View>

          <View className="w-full items-center gap-6">
            <NoteDisplay reading={reading} status={status} />
            <TunerDial cents={cents} status={status} />
          </View>

          <View className="w-full items-center gap-6">
            <PitchHistoryGraph history={history} status={status} />
            <StringRow strings={tuning.strings} activeMidi={activeMidi} />
          </View>
        </View>
      )}
    </View>
  );
}
