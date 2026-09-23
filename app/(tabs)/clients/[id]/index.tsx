import { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Platform, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../../src/components/Avatar';
import { Card } from '../../../../src/components/Card';
import { EmptyState } from '../../../../src/components/EmptyState';
import { StatusBadge } from '../../../../src/components/StatusBadge';
import { getClient } from '../../../../src/db/repositories/clients.repo';
import { listDocuments } from '../../../../src/db/repositories/documents.repo';
import { formatMinor } from '../../../../src/lib/money';
import { useClientsStore } from '../../../../src/stores/useClientsStore';
import type { Client, DocumentListItem } from '../../../../src/types/models';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const archiveClient = useClientsStore((s) => s.archive);
  const deleteClient = useClientsStore((s) => s.delete);
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getClient(id).then(setClient);
      listDocuments().then((all) => setDocuments(all.filter((d) => d.client_id === id)));
    }, [id])
  );

  useEffect(() => {
    if (!client) return;
    navigation.setOptions({
      title: client.display_name,
      headerRight: () => (
        <Pressable onPress={openActionsMenu} accessibilityLabel="Client actions" hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#374151" />
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, client]);

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator />
      </View>
    );
  }

  function openActionsMenu() {
    const options = [
      { label: 'Archive', onPress: confirmArchive },
      { label: 'Delete', onPress: confirmDelete },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options.map((o) => o.label), 'Close'], cancelButtonIndex: options.length, destructiveButtonIndex: [0, 1] },
        (index) => {
          if (index < options.length) options[index].onPress();
        }
      );
    } else {
      Alert.alert('Client Actions', undefined, [
        ...options.map((o) => ({ text: o.label, style: 'destructive' as const, onPress: o.onPress })),
        { text: 'Close', style: 'cancel' as const },
      ]);
    }
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

  function confirmDelete() {
    Alert.alert(
      'Delete client?',
      "This client will be permanently deleted. Their past documents will be kept but no longer linked to them. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(id);
            router.replace('/(tabs)/clients');
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-grouped">
      <View className="bg-card p-4 border-b border-separator flex-row items-center gap-3">
        <Avatar name={client.display_name} photoUri={client.photo_uri} seed={client.id} size={56} />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-label">{client.display_name}</Text>
          {client.contact_name ? <Text className="text-sm text-secondary">{client.contact_name}</Text> : null}
          {client.email ? <Text className="text-sm text-secondary">{client.email}</Text> : null}
          {client.phone ? <Text className="text-sm text-secondary">{client.phone}</Text> : null}
          {client.address ? <Text className="text-sm text-secondary">{client.address}</Text> : null}
          <View className="flex-row gap-3 mt-2">
            <Pressable onPress={() => router.push(`/clients/${id}/edit`)}>
              <Text className="text-tint text-sm font-medium">Edit</Text>
            </Pressable>
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
                <Text className="text-base font-semibold text-label" numberOfLines={1}>
                  {item.doc_number}
                </Text>
                <StatusBadge document={item} />
              </View>
              <Text className="text-base font-medium text-label" numberOfLines={1}>
                {formatMinor(item.total_minor, item.currency_code)}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
