import { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLogList } from '../../../../src/components/ActivityLogList';
import { Avatar } from '../../../../src/components/Avatar';
import { Button } from '../../../../src/components/Button';
import { Card } from '../../../../src/components/Card';
import { DocumentStageIndicator } from '../../../../src/components/DocumentStageIndicator';
import { LineItemRow } from '../../../../src/components/LineItemRow';
import { StatusBadge } from '../../../../src/components/StatusBadge';
import { listActivity } from '../../../../src/db/repositories/activityLog.repo';
import { getClient } from '../../../../src/db/repositories/clients.repo';
import {
  convertEstimateToInvoice,
  deleteDraftDocument,
  getDocument,
  issueDocument,
  markViewed,
  voidDocument,
} from '../../../../src/db/repositories/documents.repo';
import { listLineItems } from '../../../../src/db/repositories/lineItems.repo';
import { listSettlements } from '../../../../src/db/repositories/settlements.repo';
import { deleteSignature, listSignatures } from '../../../../src/db/repositories/signatures.repo';
import { generateDocumentPdf } from '../../../../src/lib/pdf/generatePdf';
import { emailPdf, sharePdf } from '../../../../src/lib/share';
import { getTaxLabel } from '../../../../src/lib/documentCalculations';
import { formatMinor } from '../../../../src/lib/money';
import {
  canConvertToInvoice,
  canDelete,
  canEdit,
  canIssue,
  canLogSettlement,
  canMarkViewed,
  canVoid,
  isOverdue,
} from '../../../../src/lib/statusMachine';
import { BRAND } from '../../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../../src/stores/useBusinessProfileStore';
import type {
  ActivityLogEntry,
  Client,
  DocumentRecord,
  LineItem,
  Settlement,
  SignatureRecord,
} from '../../../../src/types/models';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const profile = useBusinessProfileStore((s) => s.profile);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [voidPromptVisible, setVoidPromptVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');

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

  useEffect(() => {
    if (!document) return;
    const doc = document;
    navigation.setOptions({
      title: doc.doc_number,
      headerRight: () => (
        <View className="flex-row items-center gap-4">
          {canEdit(doc) ? (
            <Pressable onPress={() => router.push(`/documents/${id}/edit`)} hitSlop={8} accessibilityLabel="Edit">
              <Ionicons name="create-outline" size={22} color={BRAND.default} />
            </Pressable>
          ) : null}
          <Pressable onPress={openActionsMenu} hitSlop={8} accessibilityLabel="More actions">
            <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={BRAND.default} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, document]);

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

  function checkReadyToSend(): string | null {
    if (lines.length === 0) return 'Add at least one item before sending this document.';
    if (!client && !document?.client_name_snapshot) return 'Add a client before sending this document.';
    return null;
  }

  async function handleIssue() {
    const problem = checkReadyToSend();
    if (problem) {
      Alert.alert('Almost there', problem);
      return;
    }
    await withBusy(() => issueDocument(id));
  }

  async function handleMarkViewed() {
    await withBusy(() => markViewed(id));
  }

  function handleClearSignature(role: 'merchant' | 'client') {
    const whose = role === 'merchant' ? 'Your' : "The client's";
    Alert.alert('Clear signature?', `${whose} signature will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => withBusy(() => deleteSignature(id, role)) },
    ]);
  }

  function handleVoid() {
    setVoidReason('');
    setVoidPromptVisible(true);
  }

  async function confirmVoid() {
    setVoidPromptVisible(false);
    await withBusy(() => voidDocument(id, voidReason.trim() || 'No reason given'));
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

  function openActionsMenu() {
    if (!document) return;
    const options: Array<{ label: string; onPress: () => void; destructive?: boolean }> = [
      { label: 'Share PDF', onPress: () => handleGeneratePdfAnd('view') },
    ];
    if (canMarkViewed(document)) {
      options.push({ label: 'Mark as Viewed', onPress: handleMarkViewed });
    }
    if (canVoid(document)) {
      options.push({
        label: document.doc_type === 'estimate' ? 'Cancel Estimate' : 'Cancel Invoice',
        onPress: handleVoid,
        destructive: true,
      });
    }
    if (canDelete(document)) {
      options.push({ label: 'Delete Draft', onPress: handleDelete, destructive: true });
    }

    if (Platform.OS === 'ios') {
      const destructiveButtonIndex = options
        .map((o, i) => (o.destructive ? i : -1))
        .filter((i) => i >= 0);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((o) => o.label), 'Close'],
          cancelButtonIndex: options.length,
          destructiveButtonIndex,
        },
        (index) => {
          if (index < options.length) options[index].onPress();
        }
      );
    } else {
      Alert.alert('Document Actions', undefined, [
        ...options.map((o) => ({
          text: o.label,
          style: o.destructive ? ('destructive' as const) : undefined,
          onPress: o.onPress,
        })),
        { text: 'Close', style: 'cancel' as const },
      ]);
    }
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
    const problem = checkReadyToSend();
    if (problem) {
      Alert.alert('Almost there', problem);
      return;
    }
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
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>
      <Card>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900">{document.doc_number}</Text>
          <StatusBadge document={document} />
        </View>
        <View className="mb-3">
          <DocumentStageIndicator document={document} />
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
            <Text className="text-xs text-gray-500">Issued</Text>
            <Text className="text-sm text-gray-900">{document.issue_date ?? '—'}</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500">{document.doc_type === 'invoice' ? 'Payment Due' : 'Valid Until'}</Text>
            <Text className="text-sm text-gray-900">
              {document.doc_type === 'invoice' ? document.due_date ?? '—' : document.expiry_date ?? '—'}
            </Text>
          </View>
        </View>
        {document.status === 'void' ? (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500">Canceled{document.voided_at ? ` on ${document.voided_at.slice(0, 10)}` : ''}</Text>
            <Text className="text-sm text-gray-700 mt-0.5">{document.void_reason ?? 'No reason given'}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-gray-900 mb-2">Line Items</Text>
        {lines.length > 0 ? (
          lines.map((line) => <LineItemRow key={line.id} line={line} currencyCode={document.currency_code} />)
        ) : (
          <Text className="text-sm text-gray-500 py-2">No line items yet — tap Edit to add some.</Text>
        )}
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
          <TotalsRow
            label={getTaxLabel(lines.map((l) => ({ isTaxable: l.is_taxable === 1, taxName: l.tax_bracket_name_snapshot })))}
            valueMinor={document.tax_total_minor}
            currencyCode={document.currency_code}
          />
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

      {!canEdit(document) && document.status !== 'void' ? (
        <Text className="text-xs text-gray-500">
          Editing is locked because this {document.doc_type === 'estimate' ? 'estimate' : 'invoice'} has been
          issued.
        </Text>
      ) : null}

      {settlements.length > 0 ? (
        <Card>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Payments</Text>
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

      <Card>
        <Text className="text-sm font-semibold text-gray-900 mb-2">Signatures</Text>
        {(['merchant', 'client'] as const).map((role) => {
          const sig = signatures.find((s) => s.signer_role === role);
          if (sig) {
            return (
              <View key={role} className="flex-row justify-between items-center py-1">
                <Text className="text-sm text-gray-700">
                  {role === 'merchant' ? 'You' : 'Client'} signed {sig.signed_at.slice(0, 10)}
                </Text>
                <Button label="Clear" variant="destructive" size="small" onPress={() => handleClearSignature(role)} />
              </View>
            );
          }
          return (
            <View key={role} className="flex-row justify-between items-center py-1">
              <Text className="text-sm text-gray-500">
                {role === 'merchant' ? "You haven't signed" : "Client hasn't signed"}
              </Text>
              <Button
                label={role === 'merchant' ? 'Sign as Me' : 'Get Signature'}
                variant="tinted"
                size="small"
                onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role } })}
              />
            </View>
          );
        })}
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-gray-900 mb-2">Activity</Text>
        <ActivityLogList entries={activity} />
      </Card>
      </ScrollView>

      {primaryAction ? (
        <View className="p-4 bg-white border-t border-gray-100 gap-1.5">
          <Button label={primaryAction.label} variant="filled" size="large" onPress={primaryAction.onPress} />
          <Text className="text-xs text-gray-500 text-center">{primaryAction.caption}</Text>
        </View>
      ) : null}

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-white/60">
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      <Modal visible={voidPromptVisible} transparent animationType="fade" onRequestClose={() => setVoidPromptVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="bg-white rounded-2xl p-5 w-full gap-3">
            <Text className="text-base font-semibold text-gray-900">
              Cancel this {document.doc_type === 'estimate' ? 'estimate' : 'invoice'}?
            </Text>
            <Text className="text-sm text-gray-600">
              This {document.doc_type === 'estimate' ? 'estimate' : 'invoice'} will be canceled. It stays on
              record but can't be edited, sent, or paid anymore.
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900"
              placeholder="Reason (optional)"
              value={voidReason}
              onChangeText={setVoidReason}
              autoFocus
            />
            <View className="flex-row gap-2 justify-end mt-1">
              <Button label="Back" variant="plain" onPress={() => setVoidPromptVisible(false)} />
              <Button label="Cancel It" variant="destructive" onPress={confirmVoid} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
): { label: string; caption: string; onPress: () => void } | null {
  if (canIssue(document)) {
    return {
      label: document.doc_type === 'estimate' ? 'Issue Estimate' : 'Issue Invoice',
      caption: 'Finalizes the number and locks editing.',
      onPress: handlers.onIssue,
    };
  }
  if (canConvertToInvoice(document)) {
    return {
      label: 'Convert to Invoice',
      caption: 'Turn this accepted estimate into a billable invoice.',
      onPress: handlers.onConvert,
    };
  }
  if (canLogSettlement(document)) {
    return { label: 'Log Payment', caption: 'Record a payment you received for this invoice.', onPress: handlers.onLogPayment };
  }
  if (document.status === 'void') return null;
  return isOverdue(document)
    ? { label: 'Send Reminder', caption: 'Emails the client a payment reminder.', onPress: handlers.onEmail }
    : { label: 'Email Invoice', caption: 'Sends this invoice to the client by email.', onPress: handlers.onEmail };
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
