import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Platform, Pressable, RefreshControl, SectionList, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar } from '../../../src/components/Avatar';
import { EmptyState } from '../../../src/components/EmptyState';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { GroupedRow } from '../../../src/components/list/GroupedRow';
import { SwipeAction } from '../../../src/components/SwipeAction';
import { groupByInitial } from '../../../src/lib/alphabetSections';
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
                  icon={hasActiveFilter ? 'line.3.horizontal.decrease.circle.fill' : 'line.3.horizontal.decrease.circle'}
                  label="Filter"
                  selected={hasActiveFilter}
                  onPress={openFilters}
                />
                <HeaderButton icon="plus" label="Add Client" onPress={addClient} />
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
  // Contacts-style letter sections when sorted by name; one unlabeled group for "Recently Added".
  const sections =
    sortBy === 'name'
      ? groupByInitial(clients, (c) => c.display_name)
      : clients.length > 0
        ? [{ title: '', data: clients }]
        : [];

  return (
    <SectionList
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      renderSectionHeader={({ section }) =>
        section.title ? (
          <Text className="text-footnote font-semibold text-secondary px-4 pt-4 pb-2" accessibilityRole="header">
            {section.title}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        isNarrowed ? (
          <EmptyState icon="magnifyingglass" title="No Results" subtitle="Try a different search or filter." />
        ) : (
          <EmptyState
            icon="person.2"
            title="No Clients"
            subtitle="Add the people and businesses you bill."
            actionLabel="Add Client"
            onAction={addClient}
          />
        )
      }
      renderItem={({ item, index, section }) => {
        const actions = [
          { name: 'edit', label: 'Edit', run: () => handleEdit(item) },
          { name: 'archive', label: 'Archive', run: () => handleArchive(item) },
          { name: 'delete', label: 'Delete', run: () => handleDelete(item) },
        ];
        const detail = item.email ?? item.phone ?? item.contact_name;
        return (
          <GroupedRow index={index} count={section.data.length}>
            <Swipeable
              renderRightActions={(_progress, _translation, swipeable) => (
                <View className="flex-row">
                  <SwipeAction
                    label="Edit"
                    icon="pencil"
                    color={SWIPE_COLORS.edit}
                    onPress={() => handleEdit(item, swipeable)}
                  />
                  <SwipeAction
                    label="Archive"
                    icon="archivebox"
                    color={SWIPE_COLORS.archive}
                    onPress={() => handleArchive(item, swipeable)}
                  />
                  <SwipeAction
                    label="Delete"
                    icon="trash"
                    color={SWIPE_COLORS.delete}
                    onPress={() => handleDelete(item, swipeable)}
                  />
                </View>
              )}
            >
              <Pressable
                onPress={() => router.push(`/clients/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={[item.display_name, detail].filter(Boolean).join(', ')}
                accessibilityActions={actions.map((a) => ({ name: a.name, label: a.label }))}
                onAccessibilityAction={(e) => actions.find((a) => a.name === e.nativeEvent.actionName)?.run()}
              >
                {({ pressed }) => (
                  <View className={pressed ? 'bg-fill' : 'bg-card'}>
                    {index > 0 ? <View style={{ marginLeft: 64, height: 0.5 }} className="bg-separator" /> : null}
                    <View className="flex-row items-center gap-3 px-4 py-2.5 min-h-[56px]">
                      <Avatar name={item.display_name} photoUri={item.photo_uri} seed={item.id} size={36} />
                      <View className="flex-1">
                        <Text className="text-body text-label" numberOfLines={1}>
                          {item.display_name}
                        </Text>
                        {detail ? (
                          <Text className="text-subhead text-secondary" numberOfLines={1}>
                            {detail}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </Swipeable>
          </GroupedRow>
        );
      }}
    />
  );
}
