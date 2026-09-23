import { useCallback, useLayoutEffect } from 'react';
import { Platform, ScrollView } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { EmptyState } from '../../../../src/components/EmptyState';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { addButtonItem } from '../../../../src/lib/headerItems';
import { formatMinor } from '../../../../src/lib/money';
import { useBusinessProfileStore } from '../../../../src/stores/useBusinessProfileStore';
import { useItemCatalogStore } from '../../../../src/stores/useItemCatalogStore';

function addItem() {
  router.push('/items/new');
}

export default function ItemsScreen() {
  const navigation = useNavigation();
  const { items, load } = useItemCatalogStore();
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [addButtonItem('Add Item', addItem)],
      headerRight: Platform.OS === 'ios' ? undefined : () => <HeaderButton icon="plus" label="Add Item" onPress={addItem} />,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
    >
      {items.length === 0 ? (
        <EmptyState
          icon="tag"
          title="No Items Yet"
          subtitle="Save the items and services you bill often, then add them to a document in one tap."
          actionLabel="Add Item"
          onAction={addItem}
        />
      ) : (
        <ListSection footer="Tap an item to edit it.">
          {items.map((item) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={item.description || undefined}
              value={formatMinor(item.default_unit_price_minor, currencyCode)}
              onPress={() => router.push(`/settings/items/${item.id}/edit`)}
            />
          ))}
        </ListSection>
      )}
    </ScrollView>
  );
}
