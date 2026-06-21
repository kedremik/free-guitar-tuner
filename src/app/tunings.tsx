import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useTuning } from '@/hooks/use-tuning';
import { cn } from '@/lib/cn';
import { searchTunings, tuningNotes } from '@/lib/pitch';
import { Pressable, ScrollView, Text, TextInput, View, useCSSVariable } from '@/tw';

export default function TuningsScreen() {
  const insets = useSafeAreaInsets();
  const { tuning, setTuning } = useTuning();
  const [query, setQuery] = useState('');
  const placeholderColor = useCSSVariable('--sf-text-2');

  const results = searchTunings(query);

  return (
    <View className="flex-1 bg-sf-bg" style={{ paddingTop: insets.top }}>
      <View className="gap-3 px-6 pb-3 pt-2">
        <Text className="font-rounded text-3xl font-bold text-sf-text">Tunings</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tunings…"
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          className="rounded-xl bg-sf-bg-2 px-4 py-3 text-base text-sf-text"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 gap-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {results.length === 0 ? (
          <Text className="mt-10 text-center text-base text-sf-text-2">
            No tunings match “{query.trim()}”.
          </Text>
        ) : (
          results.map((item) => {
            const selected = item.id === tuning.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTuning(item)}
                className={cn(
                  'flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-80',
                  selected ? 'bg-sf-text' : 'bg-sf-bg-2',
                )}
              >
                <View className="gap-0.5">
                  <Text
                    className={cn(
                      'font-rounded text-base font-semibold',
                      selected ? 'text-sf-bg' : 'text-sf-text',
                    )}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className={cn('font-mono text-xs', selected ? 'text-sf-bg' : 'text-sf-text-2')}
                  >
                    {tuningNotes(item)}
                  </Text>
                </View>
                {selected && (
                  <Text className="font-rounded text-lg font-bold text-sf-bg">✓</Text>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
