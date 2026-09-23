import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation, type NativeStackHeaderItem } from 'expo-router';
import { Avatar } from '../../../../src/components/Avatar';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { Icon } from '../../../../src/components/Icon';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { getClient } from '../../../../src/db/repositories/clients.repo';
import { listDocuments } from '../../../../src/db/repositories/documents.repo';
import { docTypeLabel } from '../../../../src/lib/format';
import { formatMinor } from '../../../../src/lib/money';
import { getDisplayStatus, statusLabel } from '../../../../src/lib/statusMachine';
import type { SymbolName } from '../../../../src/lib/symbols';
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
                <HeaderButton icon="pencil" label="Edit" onPress={openEditor} />
                <HeaderButton
                  icon="ellipsis.circle"
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
  const phoneDigits = client.phone?.replace(/[^\d+]/g, '');
  const outstandingMinor = documents
    .filter((d) => d.doc_type === 'invoice' && d.status !== 'draft' && d.status !== 'void')
    .reduce((sum, d) => sum + Math.max(d.total_minor - d.amount_paid_minor, 0), 0);
  const currencyCode = documents[0]?.currency_code;

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Contacts-style card: photo, name, and quick actions for reaching the client. */}
      <View className="items-center gap-2 pt-2 pb-6">
        <Avatar name={client.display_name} photoUri={client.photo_uri} seed={client.id} size={96} />
        <Text className="text-title1 font-semibold text-label text-center" accessibilityRole="header">
          {client.display_name}
        </Text>
        {client.contact_name ? <Text className="text-subhead text-secondary">{client.contact_name}</Text> : null}
        {client.phone || client.email ? (
          <View className="flex-row gap-3 mt-3">
            {client.phone ? (
              <QuickAction icon="phone.fill" label="Call" onPress={() => Linking.openURL(`tel:${phoneDigits}`)} />
            ) : null}
            {client.email ? (
              <QuickAction icon="envelope.fill" label="Mail" onPress={() => Linking.openURL(`mailto:${client.email}`)} />
            ) : null}
          </View>
        ) : null}
      </View>

      {hasContactDetails ? (
        <ListSection>
          {client.email ? (
            <ListRow
              title="Email"
              subtitle={client.email}
              onPress={() => Linking.openURL(`mailto:${client.email}`)}
              accessory="none"
              accessibilityHint="Opens Mail"
            />
          ) : null}
          {client.phone ? (
            <ListRow
              title="Phone"
              subtitle={client.phone}
              onPress={() => Linking.openURL(`tel:${phoneDigits}`)}
              accessory="none"
              accessibilityHint="Calls this number"
            />
          ) : null}
          {client.address ? <ListRow title="Address" subtitle={client.address} /> : null}
          {client.tax_registration_number ? (
            <ListRow title="Tax / VAT Number" subtitle={client.tax_registration_number} />
          ) : null}
        </ListSection>
      ) : null}

      {client.notes ? (
        <ListSection header="Notes">
          <ListRow title={client.notes} />
        </ListSection>
      ) : null}

      <ListSection
        header="Documents"
        footer={
          outstandingMinor > 0 && currencyCode
            ? `${formatMinor(outstandingMinor, currencyCode)} outstanding across unpaid invoices.`
            : undefined
        }
      >
        {documents.length > 0 ? (
          documents.map((item) => (
            <ListRow
              key={item.id}
              icon={item.doc_type === 'invoice' ? 'doc.text.fill' : 'doc.plaintext.fill'}
              title={`${docTypeLabel(item.doc_type)} ${item.doc_number}`}
              subtitle={statusLabel(getDisplayStatus(item))}
              value={formatMinor(item.total_minor, item.currency_code)}
              valueClassName="text-label"
              onPress={() => router.push(`/documents/${item.id}`)}
            />
          ))
        ) : (
          <ListRow title="No documents for this client yet" />
        )}
      </ListSection>
    </ScrollView>
  );
}

/** One of the round quick-action buttons under a contact's name, like Contacts' call and mail. */
function QuickAction({ icon, label, onPress }: { icon: SymbolName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View
          className={`w-[76px] items-center gap-1 py-2.5 rounded-2xl ${pressed ? 'bg-fill' : 'bg-card'}`}
          style={{ borderCurve: 'continuous' }}
        >
          <Icon name={icon} size={20} />
          <Text className="text-caption font-medium text-tint">{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
