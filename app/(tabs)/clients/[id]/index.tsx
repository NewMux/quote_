import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation, type NativeStackHeaderItem } from 'expo-router';
import { Avatar } from '../../../../src/components/Avatar';
import { Card } from '../../../../src/components/Card';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { StatusBadge } from '../../../../src/components/StatusBadge';
import { getClient } from '../../../../src/db/repositories/clients.repo';
import { listDocuments } from '../../../../src/db/repositories/documents.repo';
import { docTypeLabel } from '../../../../src/lib/format';
import { formatMinor } from '../../../../src/lib/money';
import { getDisplayStatus, statusLabel } from '../../../../src/lib/statusMachine';
import { useClientsStore } from '../../../../src/stores/useClientsStore';
import type { Client, DocumentListItem } from '../../../../src/types/models';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const archiveClient = useClientsStore((s) => s.archive);
  const deleteClient = useClientsStore((s) => s.delete);
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  // The header is set up in an effect; these hand it the latest handlers declared further down.
  const confirmArchiveRef = useRef<() => void>(() => {});
  const confirmDeleteRef = useRef<() => void>(() => {});

  useFocusEffect(
    useCallback(() => {
      getClient(id).then(setClient);
      listDocuments().then((all) => setDocuments(all.filter((d) => d.client_id === id)));
    }, [id])
  );

  useEffect(() => {
    if (!client) return;
    const openEditor = () => router.push(`/clients/${id}/edit`);
    const headerItems = (): NativeStackHeaderItem[] => [
      {
        type: 'menu',
        label: 'More',
        icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
        menu: {
          items: [
            {
              type: 'action',
              label: 'Archive Client',
              icon: { type: 'sfSymbol', name: 'archivebox' },
              onPress: () => confirmArchiveRef.current(),
            },
            {
              type: 'action',
              label: 'Delete Client',
              icon: { type: 'sfSymbol', name: 'trash' },
              destructive: true,
              onPress: () => confirmDeleteRef.current(),
            },
          ],
        },
      },
      { type: 'button', label: 'Edit', onPress: openEditor },
    ];
    navigation.setOptions({
      title: client.display_name,
      unstable_headerRightItems: headerItems,
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => (
              <View className="flex-row">
                <HeaderButton icon="create-outline" label="Edit" onPress={openEditor} />
                <HeaderButton
                  icon="ellipsis-horizontal-circle-outline"
                  label="More"
                  onPress={() =>
                    Alert.alert(client.display_name, undefined, [
                      { text: 'Archive Client', onPress: () => confirmArchiveRef.current() },
                      { text: 'Delete Client', style: 'destructive', onPress: () => confirmDeleteRef.current() },
                      { text: 'Cancel', style: 'cancel' },
                    ])
                  }
                />
              </View>
            ),
    });
  }, [navigation, client, id]);

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  function confirmArchive() {
    if (!client) return;
    Alert.alert(
      `Archive ${client.display_name}?`,
      "They'll no longer appear when you create new documents. Their existing documents aren't changed.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            await archiveClient(id, true);
            router.back();
          },
        },
      ]
    );
  }

  function confirmDelete() {
    if (!client) return;
    Alert.alert(
      `Delete ${client.display_name}?`,
      "Their past documents are kept but no longer linked to them. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(id);
            router.back();
          },
        },
      ]
    );
  }

  confirmArchiveRef.current = confirmArchive;
  confirmDeleteRef.current = confirmDelete;

  const hasContactDetails = !!(client.contact_name || client.email || client.phone || client.address);

  return (
    <FlatList
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View>
          <View className="items-center gap-2 mb-6">
            <Avatar name={client.display_name} photoUri={client.photo_uri} seed={client.id} size={80} />
            <Text className="text-2xl font-semibold text-label text-center" accessibilityRole="header">
              {client.display_name}
            </Text>
          </View>

          {hasContactDetails ? (
            <ListSection>
              {client.contact_name ? <ListRow title="Contact" value={client.contact_name} /> : null}
              {client.email ? (
                <ListRow
                  title="Email"
                  value={client.email}
                  onPress={() => Linking.openURL(`mailto:${client.email}`)}
                  accessory="none"
                  accessibilityHint="Opens Mail"
                />
              ) : null}
              {client.phone ? (
                <ListRow
                  title="Phone"
                  value={client.phone}
                  onPress={() => Linking.openURL(`tel:${client.phone?.replace(/[^\d+]/g, '')}`)}
                  accessory="none"
                  accessibilityHint="Calls this number"
                />
              ) : null}
              {client.address ? <ListRow title="Address" subtitle={client.address} /> : null}
            </ListSection>
          ) : null}

          <Text className="text-sm text-secondary px-4 mb-1.5" accessibilityRole="header">
            Documents
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Card className="p-4">
          <Text className="text-base text-secondary text-center">No documents for this client yet.</Text>
        </Card>
      }
      renderItem={({ item }) => {
        const total = formatMinor(item.total_minor, item.currency_code);
        return (
          <Pressable
            onPress={() => router.push(`/documents/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${docTypeLabel(item.doc_type)} ${item.doc_number}, ${statusLabel(getDisplayStatus(item))}, ${total}`}
          >
            {({ pressed }) => (
              <Card className={`p-4 flex-row justify-between items-center gap-3 ${pressed ? 'opacity-70' : ''}`}>
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-label" numberOfLines={1}>
                    {item.doc_number}
                  </Text>
                  <StatusBadge document={item} />
                </View>
                <Text className="text-base font-medium text-label" numberOfLines={1}>
                  {total}
                </Text>
              </Card>
            )}
          </Pressable>
        );
      }}
    />
  );
}
