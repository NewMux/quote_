import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { SheetHeader } from '../../src/components/SheetHeader';
import { formatMinor } from '../../src/lib/money';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import { useDocumentEditorStore } from '../../src/stores/useDocumentEditorStore';
import { useItemCatalogStore } from '../../src/stores/useItemCatalogStore';
import { useTaxBracketsStore } from '../../src/stores/useTaxBracketsStore';

export default function ItemPickerModal() {
  const { items, load } = useItemCatalogStore();
  const { taxBrackets, load: loadTaxBrackets } = useTaxBracketsStore();
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
  const addLineItemFromCatalog = useDocumentEditorStore((s) => s.addLineItemFromCatalog);
  const addBlankLineItem = useDocumentEditorStore((s) => s.addBlankLineItem);
  const [query, setQuery] = useState('');

  useEffect(() => {
    load();
    loadTaxBrackets();
  }, [load, loadTaxBrackets]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title="Select Item" />
      <View className="p-4 bg-white border-b border-gray-100">
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          placeholder="Search items…"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="No items found" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              const taxBracket = taxBrackets.find((b) => b.id === item.default_tax_bracket_id) ?? null;
              addLineItemFromCatalog(item, taxBracket);
              router.back();
            }}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center"
          >
            <Text className="text-base text-gray-900">{item.name}</Text>
            <Text className="text-sm text-gray-500">{formatMinor(item.default_unit_price_minor, currencyCode)}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Button
            label="+ Add custom line item"
            variant="tinted"
            size="large"
            onPress={() => {
              addBlankLineItem();
              router.back();
            }}
          />
        }
      />
    </View>
  );
}
