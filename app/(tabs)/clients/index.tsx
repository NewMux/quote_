import { useCallback, useEffect } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { useClientsStore } from '../../../src/stores/useClientsStore';

export default function ClientsScreen() {
  const { clients, search, setSearch, sortBy, hasBalanceOnly, load } = useClientsStore();
  const hasActiveFilter = sortBy !== 'name' || hasBalanceOnly;

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Clients" />
      <FlatList
        style={{ flex: 1 }}
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View className="flex-row items-center gap-2 mb-2">
            <View className="flex-1 flex-row items-center bg-white rounded-2xl px-3 border border-gray-200">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-2.5 px-2 text-base text-gray-900"
                placeholder="Search clients…"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable
              onPress={() => router.push('/modals/client-filter')}
              accessibilityLabel="Filter clients"
              className={`w-11 h-11 rounded-full items-center justify-center ${
                hasActiveFilter ? 'bg-brand' : 'bg-white border border-gray-200'
              }`}
            >
              <Ionicons name="options-outline" size={20} color={hasActiveFilter ? 'white' : '#374151'} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No clients yet" subtitle="Add a client to start building documents for them." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/clients/${item.id}`)}>
            <Card className="p-4 flex-row items-center gap-3">
              <Avatar name={item.display_name} photoUri={item.photo_uri} seed={item.id} size={44} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {item.display_name}
                </Text>
                {item.email ? (
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {item.email}
                  </Text>
                ) : null}
                {item.phone ? (
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {item.phone}
                  </Text>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push('/clients/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
