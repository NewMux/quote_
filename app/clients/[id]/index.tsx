import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '../../../src/components/EmptyState';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { getClient } from '../../../src/db/repositories/clients.repo';
import { listDocuments } from '../../../src/db/repositories/documents.repo';
import { formatMinor } from '../../../src/lib/money';
import type { Client, DocumentListItem } from '../../../src/types/models';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getClient(id).then(setClient);
      listDocuments().then((all) => setDocuments(all.filter((d) => d.client_id === id)));
    }, [id])
  );

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-xl font-semibold text-gray-900">{client.display_name}</Text>
        {client.contact_name ? <Text className="text-sm text-gray-500">{client.contact_name}</Text> : null}
        {client.email ? <Text className="text-sm text-gray-500">{client.email}</Text> : null}
        {client.phone ? <Text className="text-sm text-gray-500">{client.phone}</Text> : null}
        {client.address ? <Text className="text-sm text-gray-500">{client.address}</Text> : null}
        <Pressable onPress={() => router.push(`/clients/${id}/edit`)} className="mt-3 self-start">
          <Text className="text-blue-600 text-sm font-medium">Edit</Text>
        </Pressable>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="No documents for this client yet" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/documents/${item.id}`)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base font-semibold text-gray-900">{item.doc_number}</Text>
              <StatusBadge document={item} />
            </View>
            <Text className="text-base font-medium text-gray-900">
              {formatMinor(item.total_minor, item.currency_code)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
