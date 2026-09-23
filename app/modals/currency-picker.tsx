import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { SheetHeader } from '../../src/components/SheetHeader';
import { CURRENCIES } from '../../src/lib/currencies';
import { getCurrencySymbol } from '../../src/lib/money';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

export default function CurrencyPickerModal() {
  const currentCode = useBusinessProfileStore((s) => s.profile?.default_currency_code);
  const update = useBusinessProfileStore((s) => s.update);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return CURRENCIES;
    const q = query.toLowerCase();
    return CURRENCIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [query]);

  async function selectCurrency(code: string) {
    await update({ default_currency_code: code });
    router.back();
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="Select Currency" />
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="-mx-4 -mt-4 mb-4 p-4 bg-card border-b border-separator">
            <TextInput
              className="border border-field rounded-lg px-3 py-2 text-base text-label"
              placeholder="Search currencies…"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState title="No currencies found" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectCurrency(item.code)}
            className="bg-card rounded-xl p-4 mb-3 border border-separator flex-row justify-between items-center"
          >
            <View className="flex-1 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-grouped items-center justify-center">
                <Text className="text-sm font-semibold text-label">{getCurrencySymbol(item.code)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base text-label" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-secondary">{item.code}</Text>
              </View>
            </View>
            {currentCode === item.code ? <Text className="text-tint text-base">✓</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}
