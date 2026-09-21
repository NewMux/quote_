import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityLogList } from '../../../src/components/ActivityLogList';
import { Avatar } from '../../../src/components/Avatar';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
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
import { deleteSignature, listSignatures } from '../../../src/db/repositories/signatures.repo';
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
  isOverdue,
} from '../../../src/lib/statusMachine';
import { BRAND } from '../../../src/lib/theme';
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

  function handleClearSignature(role: 'merchant' | 'client') {
    Alert.alert('Clear signature?', `The ${role} signature will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => withBusy(() => deleteSignature(id, role)) },
    ]);
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
    const overdue = isOverdue(document);
    await withBusy(async () => {
      const pdfUri = await generateDocumentPdf(id);
      if (action === 'view') {
        await sharePdf(id, pdfUri);
      } else {
        const label = docType === 'estimate' ? 'Estimate' : 'Invoice';
        await emailPdf({
          documentId: id,
          pdfUri,
          recipientEmail: client?.email ?? null,
          subject: overdue ? `Payment Reminder: ${label} ${docNumber}` : `${label} ${docNumber}`,
          body: overdue
            ? `This is a friendly reminder that ${label.toLowerCase()} ${docNumber} for ${formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code)} is overdue. Please arrange payment at your earliest convenience.\n\nThank you!`
            : `Please find attached ${docType} ${docNumber}.`,
        });
      }
    });
  }

  const primaryAction = getPrimaryAction(document, {
    onIssue: handleIssue,
    onConvert: handleConvert,
    onLogPayment: () => router.push(`/documents/${id}/settlement-new`),
    onEmail: () => handleGeneratePdfAnd('email'),
  });

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
      <Card>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-900">{document.doc_number}</Text>
          <StatusBadge document={document} />
        </View>
        <View className="flex-row items-center gap-3 mb-3">
          <Avatar
            name={client?.display_name ?? document.client_name_snapshot ?? 'No client'}
            photoUri={client?.photo_uri}
            seed={client?.id ?? document.id}
            size={40}
          />
          <View className="flex-1">
            <Text className="text-base text-gray-900">
              {client?.display_name ?? document.client_name_snapshot ?? 'No client'}
            </Text>
            {client?.email ? <Text className="text-sm text-gray-500">{client.email}</Text> : null}
          </View>
        </View>
        <View className="flex-row justify-between pt-3 border-t border-gray-100">
          <View>
            <Text className="text-xs text-gray-400">Issued</Text>
            <Text className="text-sm text-gray-900">{document.issue_date ?? '—'}</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-400">{document.doc_type === 'invoice' ? 'Due' : 'Valid Until'}</Text>
            <Text className="text-sm text-gray-900">
              {document.doc_type === 'invoice' ? document.due_date ?? '—' : document.expiry_date ?? '—'}
            </Text>
          </View>
        </View>
        {document.status === 'void' ? (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-400">Voided{document.voided_at ? ` on ${document.voided_at.slice(0, 10)}` : ''}</Text>
            <Text className="text-sm text-gray-700 mt-0.5">{document.void_reason ?? 'No reason given'}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-gray-900 mb-2">Line Items</Text>
        {lines.map((line) => (
          <LineItemRow key={line.id} line={line} currencyCode={document.currency_code} />
        ))}
      </Card>

      <Card className="p-0 overflow-hidden">
        <View className="p-5 gap-1">
          <TotalsRow label="Subtotal" valueMinor={document.subtotal_minor} currencyCode={document.currency_code} />
          {document.discount_amount_minor > 0 ? (
            <TotalsRow
              label="Discount"
              valueMinor={-document.discount_amount_minor}
              currencyCode={document.currency_code}
            />
          ) : null}
          <TotalsRow label="Tax" valueMinor={document.tax_total_minor} currencyCode={document.currency_code} />
          {document.amount_paid_minor > 0 ? (
            <TotalsRow label="Paid" valueMinor={document.amount_paid_minor} currencyCode={document.currency_code} />
          ) : null}
        </View>
        <View style={{ backgroundColor: BRAND.dark }} className="flex-row justify-between items-center px-5 py-4">
          <Text className="text-white/70 text-sm">Amount</Text>
          <Text className="text-white text-lg font-bold">
            {formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code)}
          </Text>
        </View>
      </Card>

      <View className="flex-row flex-wrap gap-2">
        {canEdit(document) ? (
          <Button label="Edit" variant="tinted" onPress={() => router.push(`/documents/${id}/edit`)} />
        ) : null}
        <Button
          label="Sign (Merchant)"
          variant="tinted"
          onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role: 'merchant' } })}
        />
        <Button
          label="Sign (Client)"
          variant="tinted"
          onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role: 'client' } })}
        />
        <Button label="Share PDF" variant="tinted" onPress={() => handleGeneratePdfAnd('view')} />
        {canMarkViewed(document) ? (
          <Button label="Mark as Viewed" variant="tinted" onPress={handleMarkViewed} />
        ) : null}
        {canVoid(document) ? <Button label="Void" variant="destructive" onPress={handleVoid} /> : null}
        {canDelete(document) ? <Button label="Delete Draft" variant="destructive" onPress={handleDelete} /> : null}
      </View>

      {settlements.length > 0 ? (
        <Card>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Settlements</Text>
          {settlements.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({ pathname: `/documents/${id}/settlement-new`, params: { settlementId: s.id } })
              }
            >
              <View className="flex-row justify-between py-2 border-b border-gray-50">
                <Text className="text-sm text-gray-700">
                  {s.method} — {s.settled_date}
                </Text>
                <Text className="text-sm text-gray-900">{formatMinor(s.amount_minor, document.currency_code)}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {signatures.length > 0 ? (
        <Card>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Signatures</Text>
          {(['merchant', 'client'] as const).map((role) => {
            const sig = signatures.find((s) => s.signer_role === role);
            if (!sig) return null;
            return (
              <View key={role} className="flex-row justify-between items-center py-1">
                <Text className="text-sm text-gray-700 capitalize">
                  {role} — signed {sig.signed_at.slice(0, 10)}
                </Text>
                <Button label="Clear" variant="destructive" size="small" onPress={() => handleClearSignature(role)} />
              </View>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Text className="text-sm font-semibold text-gray-900 mb-2">Activity</Text>
        <ActivityLogList entries={activity} />
      </Card>

      {primaryAction ? <Button label={primaryAction.label} variant="filled" size="large" onPress={primaryAction.onPress} /> : null}

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-white/60">
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </ScrollView>
  );
}

interface PrimaryActionHandlers {
  onIssue: () => void;
  onConvert: () => void;
  onLogPayment: () => void;
  onEmail: () => void;
}

function getPrimaryAction(
  document: DocumentRecord,
  handlers: PrimaryActionHandlers
): { label: string; onPress: () => void } | null {
  if (canIssue(document)) return { label: 'Issue', onPress: handlers.onIssue };
  if (canConvertToInvoice(document)) return { label: 'Convert to Invoice', onPress: handlers.onConvert };
  if (canLogSettlement(document)) return { label: 'Log Payment', onPress: handlers.onLogPayment };
  if (document.status === 'void') return null;
  return { label: isOverdue(document) ? 'Send Reminder' : 'Email Invoice', onPress: handlers.onEmail };
}

function TotalsRow({
  label,
  valueMinor,
  currencyCode,
}: {
  label: string;
  valueMinor: number;
  currencyCode: string;
}) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm text-gray-900">{formatMinor(valueMinor, currencyCode)}</Text>
    </View>
  );
}
