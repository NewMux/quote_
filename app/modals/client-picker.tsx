import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useClientsStore } from '../../src/stores/useClientsStore';
import { useDocumentEditorStore } from '../../src/stores/useDocumentEditorStore';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';

export default function ClientPickerModal() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isFilterMode = mode === 'filter';
  const { clients, load, create } = useClientsStore();
  const setClient = useDocumentEditorStore((s) => s.setClient);
  const { filter, setFilter } = useDocumentsStore();
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase();
    return clients.filter((c) => c.display_name.toLowerCase().includes(q));
  }, [clients, query]);

  function selectClient(clientId: string, clientName: string) {
    if (isFilterMode) {
      setFilter({ ...filter, clientId });
    } else {
      setClient(clientId, clientName);
    }
    router.back();
  }

  async function quickAddClient() {
    if (!query.trim()) return;
    setIsCreating(true);
    const client = await create({ display_name: query.trim() });
    setIsCreating(false);
    selectClient(client.id, client.display_name);
  }

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title={isFilterMode ? 'Filter by Client' : 'Select Client'} />
      <View className="p-4 bg-white border-b border-gray-100">
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          placeholder="Search clients…"
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
        ListHeaderComponent={
          isFilterMode ? (
            <Pressable
              onPress={() => {
                setFilter({ ...filter, clientId: undefined });
                router.back();
              }}
              className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
            >
              <Text className="text-base text-brand font-medium">All Clients</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={<EmptyState title="No clients found" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectClient(item.id, item.display_name)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
          >
            <Text className="text-base text-gray-900">{item.display_name}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          !isFilterMode &&
          query.trim() &&
          !filtered.some((c) => c.display_name.toLowerCase() === query.trim().toLowerCase()) ? (
            <Button
              label={`+ Add "${query.trim()}" as new client`}
              variant="tinted"
              size="large"
              disabled={isCreating}
              onPress={quickAddClient}
            />
          ) : null
        }
      />
    </View>
  );
}
