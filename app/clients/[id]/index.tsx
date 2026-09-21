import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Avatar } from '../../../src/components/Avatar';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { getClient } from '../../../src/db/repositories/clients.repo';
import { listDocuments } from '../../../src/db/repositories/documents.repo';
import { formatMinor } from '../../../src/lib/money';
import { useClientsStore } from '../../../src/stores/useClientsStore';
import type { Client, DocumentListItem } from '../../../src/types/models';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const archiveClient = useClientsStore((s) => s.archive);
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getClient(id).then(setClient);
      listDocuments().then((all) => setDocuments(all.filter((d) => d.client_id === id)));
    }, [id])
  );

  useEffect(() => {
    if (client) navigation.setOptions({ title: client.display_name });
  }, [navigation, client]);

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  function confirmArchive() {
    Alert.alert('Archive client?', 'They will no longer appear when creating new documents.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archiveClient(id, true);
          router.replace('/(tabs)/clients');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white p-4 border-b border-gray-100 flex-row items-center gap-3">
        <Avatar name={client.display_name} photoUri={client.photo_uri} seed={client.id} size={56} />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-gray-900">{client.display_name}</Text>
          {client.contact_name ? <Text className="text-sm text-gray-500">{client.contact_name}</Text> : null}
          {client.email ? <Text className="text-sm text-gray-500">{client.email}</Text> : null}
          {client.phone ? <Text className="text-sm text-gray-500">{client.phone}</Text> : null}
          {client.address ? <Text className="text-sm text-gray-500">{client.address}</Text> : null}
          <View className="flex-row gap-3 mt-2">
            <Pressable onPress={() => router.push(`/clients/${id}/edit`)}>
              <Text className="text-brand text-sm font-medium">Edit</Text>
            </Pressable>
            <Button label="Archive" variant="destructive" size="small" onPress={confirmArchive} />
          </View>
        </View>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState title="No documents for this client yet" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/documents/${item.id}`)}>
            <Card className="p-4 flex-row justify-between items-center gap-3">
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {item.doc_number}
                </Text>
                <StatusBadge document={item} />
              </View>
              <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
                {formatMinor(item.total_minor, item.currency_code)}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
