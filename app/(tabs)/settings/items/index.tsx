import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../../../../src/components/Card';
import { EmptyState } from '../../../../src/components/EmptyState';
import { formatMinor } from '../../../../src/lib/money';
import { useBusinessProfileStore } from '../../../../src/stores/useBusinessProfileStore';
import { useItemCatalogStore } from '../../../../src/stores/useItemCatalogStore';

export default function ItemsScreen() {
  const { items, load } = useItemCatalogStore();
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState title="No items yet" subtitle="Save items or services you bill often for one-tap insertion." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/items/${item.id}/edit`)}>
            <Card className="mb-3 p-4 flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                {formatMinor(item.default_unit_price_minor, currencyCode)}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
