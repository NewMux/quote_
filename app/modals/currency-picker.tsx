import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { GroupedRow } from '../../src/components/list/GroupedRow';
import { ListRow } from '../../src/components/list/ListRow';
import { SearchField } from '../../src/components/SearchField';
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
      <SheetHeader title="Currency" />
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="mb-4">
            <SearchField value={query} onChangeText={setQuery} placeholder="Search Currencies" />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="search" title="No Results" subtitle="Try a currency name or code." />}
        renderItem={({ item, index }) => (
          <GroupedRow index={index} count={filtered.length}>
            <ListRow
              title={item.name}
              subtitle={item.code}
              onPress={() => selectCurrency(item.code)}
              accessory={currentCode === item.code ? 'checkmark' : 'none'}
              showSeparator={index > 0}
              trailing={
                <Text className="text-[17px] text-secondary" accessibilityElementsHidden>
                  {getCurrencySymbol(item.code)}
                </Text>
              }
            />
          </GroupedRow>
        )}
      />
    </View>
  );
}
