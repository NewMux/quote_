import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { GroupedRow } from '../../src/components/list/GroupedRow';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SearchField } from '../../src/components/SearchField';
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

  useFocusEffect(
    useCallback(() => {
      load();
      loadTaxBrackets();
    }, [load, loadTaxBrackets])
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="Add Item" />
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View>
            <View className="mb-4">
              <SearchField value={query} onChangeText={setQuery} placeholder="Search Items" />
            </View>
            <ListSection>
              <ListRow
                icon="create-outline"
                title="Custom Item"
                subtitle="Type a one-time item on this document"
                onPress={() => {
                  addBlankLineItem();
                  router.back();
                }}
                accessory="none"
              />
              <ListRow
                icon="add-circle-outline"
                title="New Catalog Item"
                subtitle="Save an item to reuse on future documents"
                onPress={() => router.push('/items/new')}
                accessory="none"
              />
            </ListSection>
            {filtered.length > 0 ? (
              <Text className="text-sm text-secondary px-4 mb-1.5" accessibilityRole="header">
                Item Catalog
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title={query.trim() ? 'No Results' : 'No Saved Items'}
            subtitle={query.trim() ? undefined : 'Items you save to your catalog appear here.'}
          />
        }
        renderItem={({ item, index }) => (
          <GroupedRow index={index} count={filtered.length}>
            <ListRow
              title={item.name}
              value={formatMinor(item.default_unit_price_minor, currencyCode)}
              onPress={() => {
                const taxBracket = taxBrackets.find((b) => b.id === item.default_tax_bracket_id) ?? null;
                addLineItemFromCatalog(item, taxBracket);
                router.back();
              }}
              accessory="none"
              showSeparator={index > 0}
            />
          </GroupedRow>
        )}
      />
    </View>
  );
}
