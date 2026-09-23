import { useCallback, useEffect } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { SwipeAction } from '../../../src/components/SwipeAction';
import { BRAND } from '../../../src/lib/theme';
import { useClientsStore } from '../../../src/stores/useClientsStore';
import type { Client } from '../../../src/types/models';

export default function ClientsScreen() {
  const { clients, search, setSearch, sortBy, hasBalanceOnly, load, archive, delete: deleteClient } = useClientsStore();
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

  function handleArchive(item: Client, swipeable: SwipeableMethods) {
    swipeable.close();
    Alert.alert('Archive client?', 'They will no longer appear when creating new documents.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archive(item.id, true) },
    ]);
  }

  function handleDelete(item: Client, swipeable: SwipeableMethods) {
    swipeable.close();
    Alert.alert(
      'Delete client?',
      "This client will be permanently deleted. Their past documents will be kept but no longer linked to them. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteClient(item.id) },
      ]
    );
  }

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader title="Clients" />
      <FlatList
        style={{ flex: 1 }}
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <View className="flex-row items-center gap-2 mb-2">
            <View className="flex-1 flex-row items-center bg-card rounded-2xl px-3 border border-separator">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-2.5 px-2 text-base text-label"
                placeholder="Search clients…"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable
              onPress={() => router.push('/modals/client-filter')}
              accessibilityLabel="Filter clients"
              className={`w-11 h-11 rounded-full items-center justify-center ${
                hasActiveFilter ? 'bg-brand' : 'bg-card border border-separator'
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
          <Swipeable
            containerStyle={{ borderRadius: 16, overflow: 'hidden' }}
            renderRightActions={(_progress, _translation, swipeable) => (
              <View className="flex-row">
                <SwipeAction
                  label="Edit"
                  icon="pencil-outline"
                  color={BRAND.default}
                  onPress={() => {
                    swipeable.close();
                    router.push(`/clients/${item.id}/edit`);
                  }}
                />
                <SwipeAction
                  label="Archive"
                  icon="archive-outline"
                  color="#F59E0B"
                  onPress={() => handleArchive(item, swipeable)}
                />
                <SwipeAction
                  label="Delete"
                  icon="trash-outline"
                  color="#DC2626"
                  onPress={() => handleDelete(item, swipeable)}
                />
              </View>
            )}
          >
            <Pressable onPress={() => router.push(`/clients/${item.id}`)}>
              <Card className="p-4 flex-row items-center gap-3">
                <Avatar name={item.display_name} photoUri={item.photo_uri} seed={item.id} size={44} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-label" numberOfLines={1}>
                    {item.display_name}
                  </Text>
                  {item.email ? (
                    <Text className="text-sm text-secondary" numberOfLines={1}>
                      {item.email}
                    </Text>
                  ) : null}
                  {item.phone ? (
                    <Text className="text-sm text-secondary" numberOfLines={1}>
                      {item.phone}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          </Swipeable>
        )}
      />
    </View>
  );
}
