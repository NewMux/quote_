import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityLogList } from '../../../src/components/ActivityLogList';
import { LineItemRow } from '../../../src/components/LineItemRow';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { listActivity } from '../../../src/db/repositories/activityLog.repo';
import { getClient } from '../../../src/db/repositories/clients.repo';
import {
  convertEstimateToInvoice,
  deleteDraftDocument,
  getDocument,
  issueDocument,
  markViewed,
  voidDocument,
} from '../../../src/db/repositories/documents.repo';
import { listLineItems } from '../../../src/db/repositories/lineItems.repo';
import { listSettlements } from '../../../src/db/repositories/settlements.repo';
import { listSignatures } from '../../../src/db/repositories/signatures.repo';
import { generateDocumentPdf } from '../../../src/lib/pdf/generatePdf';
import { emailPdf, sharePdf } from '../../../src/lib/share';
import { formatMinor } from '../../../src/lib/money';
import {
  canConvertToInvoice,
  canDelete,
  canEdit,
  canIssue,
  canLogSettlement,
  canMarkViewed,
  canVoid,
} from '../../../src/lib/statusMachine';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import type {
  ActivityLogEntry,
  Client,
  DocumentRecord,
  LineItem,
  Settlement,
  SignatureRecord,
} from '../../../src/types/models';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useBusinessProfileStore((s) => s.profile);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const doc = await getDocument(id);
    setDocument(doc);
    if (doc?.client_id) setClient(await getClient(doc.client_id));
    else setClient(null);
    setLines(await listLineItems(id));
    setSignatures(await listSignatures(id));
    setSettlements(await listSettlements(id));
    setActivity(await listActivity(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (!document) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleIssue() {
    await withBusy(() => issueDocument(id));
  }

  async function handleMarkViewed() {
    await withBusy(() => markViewed(id));
  }

  function handleVoid() {
    if (Platform.OS === 'ios') {
      Alert.prompt('Void document', 'Reason for voiding (optional)', (reason) => {
        withBusy(() => voidDocument(id, reason || 'No reason given'));
      });
      return;
    }
    Alert.alert('Void document?', 'This document will be marked void and can no longer be edited.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Void', style: 'destructive', onPress: () => withBusy(() => voidDocument(id, 'No reason given')) },
    ]);
  }

  function handleDelete() {
    Alert.alert('Delete draft?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDraftDocument(id);
          router.replace('/(tabs)/documents');
        },
      },
    ]);
  }

  async function handleConvert() {
    if (!profile) return;
    await withBusy(async () => {
      const invoice = await convertEstimateToInvoice(id, profile);
      router.replace(`/documents/${invoice.id}`);
    });
  }

  async function handleGeneratePdfAnd(action: 'view' | 'email') {
    if (!document) return;
    const docType = document.doc_type;
    const docNumber = document.doc_number;
    await withBusy(async () => {
      const pdfUri = await generateDocumentPdf(id);
      if (action === 'view') {
        await sharePdf(id, pdfUri);
      } else {
        await emailPdf({
          documentId: id,
          pdfUri,
          recipientEmail: client?.email ?? null,
          subject: `${docType === 'estimate' ? 'Estimate' : 'Invoice'} ${docNumber}`,
          body: `Please find attached ${docType} ${docNumber}.`,
        });
      }
    });
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="bg-white rounded-xl p-4 border border-gray-100">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-lg font-semibold text-gray-900">{document.doc_number}</Text>
            <Text className="text-sm text-gray-500">{client?.display_name ?? document.client_name_snapshot ?? 'No client'}</Text>
          </View>
          <StatusBadge document={document} />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mt-2">
          {formatMinor(document.total_minor, document.currency_code)}
        </Text>
        {document.amount_paid_minor > 0 ? (
          <Text className="text-sm text-green-700 mt-1">
            {formatMinor(document.amount_paid_minor, document.currency_code)} paid
          </Text>
        ) : null}
      </View>

      <View className="bg-white rounded-xl p-4 border border-gray-100">
        <Text className="text-sm font-semibold text-gray-900 mb-2">Line Items</Text>
        {lines.map((line) => (
          <LineItemRow key={line.id} line={line} currencyCode={document.currency_code} />
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {canEdit(document) ? (
          <ActionButton label="Edit" onPress={() => router.push(`/documents/${id}/edit`)} />
        ) : null}
        {canIssue(document) ? <ActionButton label="Issue" onPress={handleIssue} primary /> : null}
        <ActionButton label="Sign (Merchant)" onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role: 'merchant' } })} />
        <ActionButton label="Sign (Client)" onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role: 'client' } })} />
        <ActionButton label="Share PDF" onPress={() => handleGeneratePdfAnd('view')} />
        <ActionButton label="Email PDF" onPress={() => handleGeneratePdfAnd('email')} />
        {canConvertToInvoice(document) ? (
          <ActionButton label="Convert to Invoice" onPress={handleConvert} primary />
        ) : null}
        {canLogSettlement(document) ? (
          <ActionButton label="Log Payment" onPress={() => router.push(`/documents/${id}/settlement-new`)} primary />
        ) : null}
        {canMarkViewed(document) ? <ActionButton label="Mark as Viewed" onPress={handleMarkViewed} /> : null}
        {canVoid(document) ? <ActionButton label="Void" onPress={handleVoid} destructive /> : null}
        {canDelete(document) ? <ActionButton label="Delete Draft" onPress={handleDelete} destructive /> : null}
      </View>

      {settlements.length > 0 ? (
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Settlements</Text>
          {settlements.map((s) => (
            <View key={s.id} className="flex-row justify-between py-1">
              <Text className="text-sm text-gray-700">
                {s.method} — {s.settled_date}
              </Text>
              <Text className="text-sm text-gray-900">{formatMinor(s.amount_minor, document.currency_code)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="bg-white rounded-xl p-4 border border-gray-100">
        <Text className="text-sm font-semibold text-gray-900 mb-2">Activity</Text>
        <ActivityLogList entries={activity} />
      </View>

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-white/60">
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
  destructive,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  destructive?: boolean;
}) {
  const bg = destructive ? 'bg-red-50 border-red-200' : primary ? 'bg-blue-600 border-blue-600' : 'border-gray-300';
  const textColor = destructive ? 'text-red-600' : primary ? 'text-white' : 'text-gray-700';
  return (
    <Pressable onPress={onPress} className={`px-4 py-2 rounded-full border ${bg}`}>
      <Text className={`text-sm font-medium ${textColor}`}>{label}</Text>
    </Pressable>
  );
}
