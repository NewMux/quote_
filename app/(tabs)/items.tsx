import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../src/components/EmptyState';
import { formatMinor } from '../../src/lib/money';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import { useItemCatalogStore } from '../../src/stores/useItemCatalogStore';

export default function ItemsScreen() {
  const { items, load } = useItemCatalogStore();
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState title="No items yet" subtitle="Save items or services you bill often for one-tap insertion." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/items/${item.id}/edit`)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
              {item.description ? <Text className="text-sm text-gray-500">{item.description}</Text> : null}
            </View>
            <Text className="text-base font-medium text-gray-900">
              {formatMinor(item.default_unit_price_minor, currencyCode)}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push('/items/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
