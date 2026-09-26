import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { GroupedRow } from '../../src/components/list/GroupedRow';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SearchField } from '../../src/components/SearchField';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SheetScreen } from '../../src/components/SheetScreen';
import { pickContactAsClient } from '../../src/lib/importContact';
import { useClientsStore } from '../../src/stores/useClientsStore';
import { useDocumentEditorStore } from '../../src/stores/useDocumentEditorStore';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';

export default function ClientPickerModal() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isFilterMode = mode === 'filter';
  const { clients, load, create } = useClientsStore();
  const currentClientId = useDocumentEditorStore((s) => s.clientId);
  const setClient = useDocumentEditorStore((s) => s.setClient);
  const { filter, setFilter } = useDocumentsStore();
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const selectedId = isFilterMode ? filter.clientId : currentClientId;

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase();
    return clients.filter((c) => c.display_name.toLowerCase().includes(q));
  }, [clients, query]);

  const trimmedQuery = query.trim();
  const canQuickAdd =
    !isFilterMode &&
    !!trimmedQuery &&
    !filtered.some((c) => c.display_name.toLowerCase() === trimmedQuery.toLowerCase());

  function selectClient(clientId: string | undefined, clientName?: string) {
    if (isFilterMode) {
      setFilter({ ...filter, clientId });
    } else if (clientId && clientName) {
      setClient(clientId, clientName);
    }
    router.back();
  }

  async function quickAddClient() {
    if (!trimmedQuery || isCreating) return;
    setIsCreating(true);
    try {
      const client = await create({ display_name: trimmedQuery });
      selectClient(client.id, client.display_name);
    } catch (err) {
      setIsCreating(false);
      Alert.alert('Couldn’t Add Client', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  /** Picks someone from the phone's contacts, saves them as a client, and selects them. */
  async function addFromContacts() {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const picked = await pickContactAsClient();
      if (!picked) {
        setIsCreating(false);
        return;
      }
      const client = await create(picked);
      selectClient(client.id, client.display_name);
    } catch (err) {
      setIsCreating(false);
      Alert.alert('Couldn’t Add Client', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <SheetScreen header={<SheetHeader title={isFilterMode ? 'Filter by Client' : 'Choose Client'} />}>
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
              <SearchField value={query} onChangeText={setQuery} placeholder="Search Clients" />
            </View>
            {canQuickAdd ? (
              <ListSection footer="Adds a client with just this name. You can fill in their details later.">
                <ListRow
                  icon="person.badge.plus"
                  title={`Add “${trimmedQuery}”`}
                  onPress={quickAddClient}
                  accessory="none"
                />
              </ListSection>
            ) : null}
            {!isFilterMode && !trimmedQuery ? (
              <ListSection>
                <ListRow
                  icon="person.badge.plus"
                  title="Add from Contacts"
                  onPress={addFromContacts}
                  trailing={isCreating ? <ActivityIndicator accessibilityLabel="Adding Client" /> : undefined}
                  accessory="none"
                />
              </ListSection>
            ) : null}
            {isFilterMode ? (
              <ListSection>
                <ListRow
                  title="All Clients"
                  onPress={() => selectClient(undefined)}
                  accessory={!filter.clientId ? 'checkmark' : 'none'}
                />
              </ListSection>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          canQuickAdd ? null : (
            <EmptyState
              icon="person.2"
              title={trimmedQuery ? 'No Results' : 'No Clients Yet'}
              subtitle={trimmedQuery ? undefined : 'Type a name above to add your first client.'}
            />
          )
        }
        renderItem={({ item, index }) => (
          <GroupedRow index={index} count={filtered.length}>
            <ListRow
              title={item.display_name}
              subtitle={item.email ?? undefined}
              onPress={() => selectClient(item.id, item.display_name)}
              accessory={item.id === selectedId ? 'checkmark' : 'none'}
              showSeparator={index > 0}
            />
          </GroupedRow>
        )}
      />
    </SheetScreen>
  );
}
