import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { SwipeAction } from '../../../src/components/SwipeAction';
import { addButtonItem, filterButtonItem } from '../../../src/lib/headerItems';
import { SWIPE_COLORS } from '../../../src/lib/theme';
import { useClientsStore } from '../../../src/stores/useClientsStore';
import type { Client } from '../../../src/types/models';

function openFilters() {
  router.push('/modals/client-filter');
}

function addClient() {
  router.push('/clients/new');
}

export default function ClientsScreen() {
  const navigation = useNavigation();
  const { clients, search, setSearch, sortBy, hasBalanceOnly, load, archive, delete: deleteClient } = useClientsStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasActiveFilter = sortBy !== 'name' || hasBalanceOnly;

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [addButtonItem('Add Client', addClient), filterButtonItem(hasActiveFilter, openFilters)],
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => (
              <View className="flex-row">
                <HeaderButton
                  icon={hasActiveFilter ? 'filter-circle' : 'filter-circle-outline'}
                  label="Filter"
                  selected={hasActiveFilter}
                  onPress={openFilters}
                />
                <HeaderButton icon="add" label="Add Client" onPress={addClient} />
              </View>
            ),
      headerSearchBarOptions: {
        placeholder: 'Search Clients',
        autoCapitalize: 'none',
        onChangeText: (event: { nativeEvent: { text: string } }) => setSearch(event.nativeEvent.text),
      },
    });
  }, [navigation, hasActiveFilter, setSearch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleEdit(item: Client, swipeable?: SwipeableMethods) {
    swipeable?.close();
    router.push(`/clients/${item.id}/edit`);
  }

  function handleArchive(item: Client, swipeable?: SwipeableMethods) {
    swipeable?.close();
    Alert.alert(
      `Archive ${item.display_name}?`,
      "They'll no longer appear when you create new documents. Their existing documents aren't changed.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: () => archive(item.id, true) },
      ]
    );
  }

  function handleDelete(item: Client, swipeable?: SwipeableMethods) {
    swipeable?.close();
    Alert.alert(
      `Delete ${item.display_name}?`,
      "Their past documents are kept but no longer linked to them. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteClient(item.id) },
      ]
    );
  }

  const isNarrowed = hasActiveFilter || !!search.trim();

  return (
    <FlatList
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      data={clients}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      ListEmptyComponent={
        isNarrowed ? (
          <EmptyState icon="search" title="No Results" subtitle="Try a different search or filter." />
        ) : (
          <EmptyState
            icon="people-outline"
            title="No Clients Yet"
            subtitle="Add the people and businesses you bill."
            actionLabel="Add Client"
            onAction={addClient}
          />
        )
      }
      renderItem={({ item }) => {
        const actions = [
          { name: 'edit', label: 'Edit', run: () => handleEdit(item) },
          { name: 'archive', label: 'Archive', run: () => handleArchive(item) },
          { name: 'delete', label: 'Delete', run: () => handleDelete(item) },
        ];
        return (
          <Swipeable
            containerStyle={{ borderRadius: 24, overflow: 'hidden' }}
            renderRightActions={(_progress, _translation, swipeable) => (
              <View className="flex-row">
                <SwipeAction
                  label="Edit"
                  icon="pencil-outline"
                  color={SWIPE_COLORS.edit}
                  onPress={() => handleEdit(item, swipeable)}
                />
                <SwipeAction
                  label="Archive"
                  icon="archive-outline"
                  color={SWIPE_COLORS.archive}
                  onPress={() => handleArchive(item, swipeable)}
                />
                <SwipeAction
                  label="Delete"
                  icon="trash-outline"
                  color={SWIPE_COLORS.delete}
                  onPress={() => handleDelete(item, swipeable)}
                />
              </View>
            )}
          >
            <Pressable
              onPress={() => router.push(`/clients/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={[item.display_name, item.email, item.phone].filter(Boolean).join(', ')}
              accessibilityActions={actions.map((a) => ({ name: a.name, label: a.label }))}
              onAccessibilityAction={(e) => actions.find((a) => a.name === e.nativeEvent.actionName)?.run()}
            >
              {({ pressed }) => (
                <Card className={`p-4 flex-row items-center gap-3 ${pressed ? 'opacity-70' : ''}`}>
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
              )}
            </Pressable>
          </Swipeable>
        );
      }}
    />
  );
}
