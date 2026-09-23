import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { router, useFocusEffect, useLocalSearchParams, useNavigation, type NativeStackHeaderItem } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'sf-symbols-typescript';
import { ActivityLogList } from '../../../../src/components/ActivityLogList';
import { Avatar } from '../../../../src/components/Avatar';
import { Button } from '../../../../src/components/Button';
import { Card } from '../../../../src/components/Card';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { DocumentStageIndicator } from '../../../../src/components/DocumentStageIndicator';
import { LineItemRow } from '../../../../src/components/LineItemRow';
import { StatusBadge } from '../../../../src/components/StatusBadge';
import { listActivity } from '../../../../src/db/repositories/activityLog.repo';
import { getClient } from '../../../../src/db/repositories/clients.repo';
import {
  convertEstimateToInvoice,
  deleteDocument,
  getDocument,
  issueDocument,
  markViewed,
  voidDocument,
} from '../../../../src/db/repositories/documents.repo';
import { listLineItems } from '../../../../src/db/repositories/lineItems.repo';
import { getScheduleForDocument } from '../../../../src/db/repositories/recurring.repo';
import { listSettlements } from '../../../../src/db/repositories/settlements.repo';
import { deleteSignature, listSignatures } from '../../../../src/db/repositories/signatures.repo';
import { generateDocumentPdf } from '../../../../src/lib/pdf/generatePdf';
import { emailPdf, sharePdf } from '../../../../src/lib/share';
import { getTaxLabel } from '../../../../src/lib/documentCalculations';
import { formatMinor } from '../../../../src/lib/money';
import { describeSchedule } from '../../../../src/lib/recurrence';
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
  RecurringSchedule,
  Settlement,
  SignatureRecord,
} from '../../../../src/types/models';

interface MenuAction {
  label: string;
  symbol: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
}

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
  const [schedule, setSchedule] = useState<RecurringSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [voidPromptVisible, setVoidPromptVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  // The header is configured in an effect, but its menu handlers are declared further down (after
  // the loading early-return); refs hand the effect the latest versions without reordering them.
  const menuActionsRef = useRef<() => MenuAction[]>(() => []);
  const openActionsMenuRef = useRef<() => void>(() => {});

  const reload = useCallback(async () => {
    const doc = await getDocument(id);
    setDocument(doc);
    if (doc?.client_id) setClient(await getClient(doc.client_id));
    else setClient(null);
    setLines(await listLineItems(id));
    setSignatures(await listSignatures(id));
    setSettlements(await listSettlements(id));
    setActivity(await listActivity(id));
    setSchedule(doc?.doc_type === 'invoice' ? await getScheduleForDocument(id).catch(() => null) : null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    if (!document) return;
    const doc = document;
    const openEditor = () => router.push(`/documents/${id}/edit`);
    const buildHeaderItems = (): NativeStackHeaderItem[] => {
      const items: NativeStackHeaderItem[] = [
        {
          type: 'menu',
          label: 'More',
          icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
          menu: {
            items: menuActionsRef.current().map((action) => ({
              type: 'action' as const,
              label: action.label,
              icon: { type: 'sfSymbol' as const, name: action.symbol },
              destructive: action.destructive,
              onPress: action.onPress,
            })),
          },
        },
      ];
      if (canEdit(doc)) {
        items.push({ type: 'button', label: 'Edit', icon: { type: 'sfSymbol', name: 'pencil' }, onPress: openEditor });
      }
      return items;
    };
    navigation.setOptions({
      title: doc.doc_number,
      unstable_headerRightItems: buildHeaderItems,
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => (
              <View className="flex-row">
                {canEdit(doc) ? <HeaderButton icon="create-outline" label="Edit" onPress={openEditor} /> : null}
                <HeaderButton icon="ellipsis-horizontal-circle-outline" label="More" onPress={() => openActionsMenuRef.current()} />
              </View>
            ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, document, schedule]);

  if (!document) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
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
      Alert.alert('Not Ready to Send', problem);
      return;
    }
    await withBusy(() => issueDocument(id));
  }

  async function handleMarkViewed() {
    // The new "Viewed" entry in the Activity section is the confirmation; no dialog needed.
    await withBusy(() => markViewed(id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleClearSignature(role: 'merchant' | 'client') {
    const whose = role === 'merchant' ? 'Your' : "The client's";
    Alert.alert('Clear Signature?', `${whose} signature will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => withBusy(() => deleteSignature(id, role)) },
    ]);
  }

  function handleVoid() {
    if (!document) return;
    const label = document.doc_type === 'estimate' ? 'Estimate' : 'Invoice';
    if (Platform.OS === 'ios') {
      Alert.prompt(
        `Cancel This ${label}?`,
        "It stays on record but can't be edited, sent, or paid anymore. Add a reason if you like.",
        [
          { text: `Don't Cancel`, style: 'cancel' },
          {
            text: `Cancel ${label}`,
            style: 'destructive',
            onPress: (reason?: string) => withBusy(() => voidDocument(id, reason?.trim() || 'No reason given')),
          },
        ],
        'plain-text',
        '',
        'default'
      );
      return;
    }
    setVoidReason('');
    setVoidPromptVisible(true);
  }

  async function confirmVoid() {
    setVoidPromptVisible(false);
    await withBusy(() => voidDocument(id, voidReason.trim() || 'No reason given'));
  }

  function handleDelete() {
    if (!document) return;
    Alert.alert(
      `Delete ${document.doc_number}?`,
      "This permanently deletes the document with its line items, signatures, and payment records. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(id);
              router.replace('/(tabs)/documents');
            } catch (err) {
              Alert.alert('Could Not Delete', err instanceof Error ? err.message : 'Something went wrong.');
            }
          },
        },
      ]
    );
  }

  /** The document's secondary actions: a native menu on iOS, a dialog list on Android. */
  function getMenuActions() {
    if (!document) return [];
    const label = document.doc_type === 'estimate' ? 'Estimate' : 'Invoice';
    const actions: MenuAction[] = [
      { label: 'Share PDF', symbol: 'square.and.arrow.up', onPress: () => handleGeneratePdfAnd('view') },
    ];
    if (canMarkViewed(document)) {
      actions.push({ label: 'Mark as Viewed', symbol: 'eye', onPress: handleMarkViewed });
    }
    if (document.doc_type === 'invoice' && document.status !== 'void') {
      actions.push({
        label: schedule ? 'Edit Recurring' : 'Make Recurring',
        symbol: 'repeat',
        onPress: () => router.push({ pathname: '/modals/recurring', params: { documentId: id } }),
      });
    }
    if (canVoid(document)) {
      actions.push({ label: `Cancel ${label}`, symbol: 'xmark.circle', onPress: handleVoid, destructive: true });
    }
    if (canDelete(document)) {
      actions.push({ label: `Delete ${label}`, symbol: 'trash', onPress: handleDelete, destructive: true });
    }
    return actions;
  }

  function openActionsMenu() {
    Alert.alert(document?.doc_number ?? 'Document', undefined, [
      ...getMenuActions().map((a) => ({
        text: a.label,
        style: a.destructive ? ('destructive' as const) : undefined,
        onPress: a.onPress,
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  menuActionsRef.current = getMenuActions;
  openActionsMenuRef.current = openActionsMenu;

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
      Alert.alert('Not Ready to Send', problem);
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
    <View className="flex-1 bg-grouped">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>
      <Card>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-label">{document.doc_number}</Text>
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
            <Text className="text-base text-label">
              {client?.display_name ?? document.client_name_snapshot ?? 'No client'}
            </Text>
            {client?.email ? <Text className="text-sm text-secondary">{client.email}</Text> : null}
          </View>
        </View>
        <View className="flex-row justify-between pt-3 border-t border-separator">
          <View>
            <Text className="text-xs text-secondary">Issued</Text>
            <Text className="text-sm text-label">{document.issue_date ?? '—'}</Text>
          </View>
          <View>
            <Text className="text-xs text-secondary">{document.doc_type === 'invoice' ? 'Payment Due' : 'Valid Until'}</Text>
            <Text className="text-sm text-label">
              {document.doc_type === 'invoice' ? document.due_date ?? '—' : document.expiry_date ?? '—'}
            </Text>
          </View>
        </View>
        {document.status === 'void' ? (
          <View className="mt-3 pt-3 border-t border-separator">
            <Text className="text-xs text-secondary">Canceled{document.voided_at ? ` on ${document.voided_at.slice(0, 10)}` : ''}</Text>
            <Text className="text-sm text-label mt-0.5">{document.void_reason ?? 'No reason given'}</Text>
          </View>
        ) : null}
      </Card>

      {schedule ? (
        <Pressable onPress={() => router.push({ pathname: '/modals/recurring', params: { documentId: id } })}>
          <Card className="flex-row items-center gap-3">
            <Ionicons name="repeat" size={20} color={BRAND.default} />
            <Text className="flex-1 text-sm text-label" numberOfLines={2}>
              {describeSchedule(schedule.frequency, schedule.next_run_date)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Card>
        </Pressable>
      ) : null}

      <Card>
        <Text className="text-sm font-semibold text-label mb-2">Line Items</Text>
        {lines.length > 0 ? (
          lines.map((line) => <LineItemRow key={line.id} line={line} currencyCode={document.currency_code} />)
        ) : (
          <Text className="text-sm text-secondary py-2">No line items yet — tap Edit to add some.</Text>
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
        <Text className="text-xs text-secondary">
          Editing is locked because this {document.doc_type === 'estimate' ? 'estimate' : 'invoice'} has been
          issued.
        </Text>
      ) : null}

      {settlements.length > 0 ? (
        <Card>
          <Text className="text-sm font-semibold text-label mb-2">Payments</Text>
          {settlements.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({ pathname: `/documents/${id}/settlement-new`, params: { settlementId: s.id } })
              }
            >
              <View className="flex-row justify-between py-2 border-b border-separator">
                <Text className="text-sm text-label">
                  {s.method} — {s.settled_date}
                </Text>
                <Text className="text-sm text-label">{formatMinor(s.amount_minor, document.currency_code)}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text className="text-sm font-semibold text-label mb-2">Signatures</Text>
        {(['merchant', 'client'] as const).map((role) => {
          const sig = signatures.find((s) => s.signer_role === role);
          if (sig) {
            return (
              <View key={role} className="flex-row justify-between items-center py-1">
                <Text className="text-sm text-label">
                  {role === 'merchant' ? 'You' : 'Client'} signed {sig.signed_at.slice(0, 10)}
                </Text>
                <Button label="Clear" variant="destructive" size="small" onPress={() => handleClearSignature(role)} />
              </View>
            );
          }
          return (
            <View key={role} className="flex-row justify-between items-center py-1">
              <Text className="text-sm text-secondary">
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
        <Text className="text-sm font-semibold text-label mb-2">Activity</Text>
        <ActivityLogList entries={activity} />
      </Card>
      </ScrollView>

      {primaryAction ? (
        <View className="p-4 bg-card border-t border-separator gap-1.5">
          <Button label={primaryAction.label} variant="filled" size="large" onPress={primaryAction.onPress} />
          <Text className="text-xs text-secondary text-center">{primaryAction.caption}</Text>
        </View>
      ) : null}

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-card/60">
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      <Modal visible={voidPromptVisible} transparent animationType="fade" onRequestClose={() => setVoidPromptVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="bg-card rounded-2xl p-5 w-full gap-3">
            <Text className="text-base font-semibold text-label">
              Cancel this {document.doc_type === 'estimate' ? 'estimate' : 'invoice'}?
            </Text>
            <Text className="text-sm text-secondary">
              This {document.doc_type === 'estimate' ? 'estimate' : 'invoice'} will be canceled. It stays on
              record but can&apos;t be edited, sent, or paid anymore.
            </Text>
            <TextInput
              className="border border-field rounded-lg px-3 py-2 text-base text-label"
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
      <Text className="text-sm text-secondary">{label}</Text>
      <Text className="text-sm text-label">{formatMinor(valueMinor, currencyCode)}</Text>
    </View>
  );
}
