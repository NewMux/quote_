import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'TRY', name: 'Turkish Lira' },
];

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
    <View className="flex-1 bg-surface">
      <View className="p-4 bg-white border-b border-gray-100">
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          placeholder="Search currencies…"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="No currencies found" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectCurrency(item.code)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base text-gray-900">{item.code}</Text>
              <Text className="text-xs text-gray-500">{item.name}</Text>
            </View>
            {currentCode === item.code ? <Text className="text-brand text-base">✓</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}
