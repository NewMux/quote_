import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation, type NativeStackHeaderItem } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'sf-symbols-typescript';
import { ActivityLogList } from '../../../../src/components/ActivityLogList';
import { Avatar } from '../../../../src/components/Avatar';
import { Button } from '../../../../src/components/Button';
import { FormField } from '../../../../src/components/form/FormField';
import { GroupedCard } from '../../../../src/components/GroupedCard';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { DocumentStageIndicator } from '../../../../src/components/DocumentStageIndicator';
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
import { docTypeLabel, formatDisplayDate, settlementMethodLabel } from '../../../../src/lib/format';
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
import { useThemeColors } from '../../../../src/lib/theme';
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
  const colors = useThemeColors();

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
                {canEdit(doc) ? <HeaderButton icon="pencil" label="Edit" onPress={openEditor} /> : null}
                <HeaderButton icon="ellipsis.circle" label="More" onPress={() => openActionsMenuRef.current()} />
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
              Alert.alert('Couldn’t Delete', err instanceof Error ? err.message : 'Something went wrong.');
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

  const clientName = client?.display_name ?? document.client_name_snapshot ?? 'No Client';
  const balanceMinor = document.total_minor - document.amount_paid_minor;
  const amountLabel = document.doc_type === 'invoice' ? 'Balance Due' : 'Total';
  const dueDate = document.doc_type === 'invoice' ? document.due_date : document.expiry_date;
  const typeLabel = docTypeLabel(document.doc_type);

  return (
    <View className="flex-1 bg-grouped">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Receipt-style header: who, how much, where it stands, and the one thing to do next. */}
        <View className="items-center pt-2 pb-7 gap-1">
          <Avatar name={clientName} photoUri={client?.photo_uri} seed={client?.id ?? document.id} size={64} />
          <Text className="text-title3 font-semibold text-label text-center mt-2" numberOfLines={2}>
            {clientName}
          </Text>
          <Text className="text-subhead text-secondary">
            {typeLabel} {document.doc_number}
          </Text>
          <View
            className="items-center mt-3"
            accessible
            accessibilityLabel={`${amountLabel}: ${formatMinor(balanceMinor, document.currency_code)}`}
          >
            <Text className="text-largetitle font-bold text-label" numberOfLines={1} adjustsFontSizeToFit>
              {formatMinor(balanceMinor, document.currency_code)}
            </Text>
            <Text className="text-footnote text-secondary">{amountLabel}</Text>
          </View>
          <View className="mt-3 items-center gap-3">
            <StatusBadge document={document} />
            <DocumentStageIndicator document={document} />
          </View>
          {primaryAction ? (
            <View className="self-stretch mt-5 gap-2">
              <Button label={primaryAction.label} variant="filled" size="large" onPress={primaryAction.onPress} />
              <Text className="text-footnote text-secondary text-center">{primaryAction.caption}</Text>
            </View>
          ) : null}
        </View>

        {document.status === 'void' ? (
          <ListSection header="Canceled">
            <ListRow
              title={document.void_reason ?? 'No reason given'}
              subtitle={document.voided_at ? `On ${formatDisplayDate(document.voided_at)}` : undefined}
            />
          </ListSection>
        ) : null}

        <ListSection>
          <ListRow
            title="Client"
            value={clientName}
            onPress={client ? () => router.push(`/clients/${client.id}`) : undefined}
          />
          <ListRow title="Issued" value={document.issue_date ? formatDisplayDate(document.issue_date) : 'Not Yet'} />
          <ListRow
            title={document.doc_type === 'invoice' ? 'Payment Due' : 'Valid Until'}
            value={dueDate ? formatDisplayDate(dueDate) : '—'}
            valueClassName={isOverdue(document) ? 'text-destructive' : undefined}
          />
          {schedule ? (
            <ListRow
              icon="repeat"
              title="Repeats"
              subtitle={describeSchedule(schedule.frequency, schedule.next_run_date)}
              onPress={() => router.push({ pathname: '/modals/recurring', params: { documentId: id } })}
              accessibilityHint="Edit the repeat schedule"
            />
          ) : null}
        </ListSection>

        <ListSection header="Items">
          {lines.length > 0 ? (
            lines.map((line) => (
              <ListRow
                key={line.id}
                title={line.description}
                subtitle={`${line.quantity}${line.unit_label ? ` ${line.unit_label}` : ''} × ${formatMinor(line.unit_price_minor, document.currency_code)}`}
                value={formatMinor(line.line_total_minor, document.currency_code)}
                valueClassName="text-label"
              />
            ))
          ) : (
            <ListRow title="No items yet" subtitle={canEdit(document) ? 'Tap Edit to add some.' : undefined} />
          )}
        </ListSection>

        <ListSection
          footer={
            !canEdit(document) && document.status !== 'void'
              ? `Editing is locked because this ${document.doc_type} has been issued.`
              : undefined
          }
        >
          <ListRow title="Subtotal" value={formatMinor(document.subtotal_minor, document.currency_code)} />
          {document.discount_amount_minor > 0 ? (
            <ListRow title="Discount" value={formatMinor(-document.discount_amount_minor, document.currency_code)} />
          ) : null}
          <ListRow
            title={getTaxLabel(lines.map((l) => ({ isTaxable: l.is_taxable === 1, taxName: l.tax_bracket_name_snapshot })))}
            value={formatMinor(document.tax_total_minor, document.currency_code)}
          />
          {document.amount_paid_minor > 0 ? (
            <ListRow title="Total" value={formatMinor(document.total_minor, document.currency_code)} />
          ) : null}
          {document.amount_paid_minor > 0 ? (
            <ListRow title="Paid" value={formatMinor(-document.amount_paid_minor, document.currency_code)} />
          ) : null}
          <ListRow title={amountLabel} value={formatMinor(balanceMinor, document.currency_code)} emphasized />
        </ListSection>

        {settlements.length > 0 ? (
          <ListSection header="Payments" footer="Tap a payment to edit or delete it.">
            {settlements.map((s) => (
              <ListRow
                key={s.id}
                icon="banknote"
                title={formatMinor(s.amount_minor, document.currency_code)}
                subtitle={`${settlementMethodLabel(s.method)} · ${formatDisplayDate(s.settled_date)}`}
                onPress={() =>
                  router.push({ pathname: `/documents/${id}/settlement-new`, params: { settlementId: s.id } })
                }
              />
            ))}
          </ListSection>
        ) : null}

        <ListSection header="Signatures">
          {(['merchant', 'client'] as const).map((role) => {
            const sig = signatures.find((s) => s.signer_role === role);
            const who = role === 'merchant' ? 'You' : 'Client';
            return (
              <ListRow
                key={role}
                icon="signature"
                iconColor={sig ? undefined : colors.secondary}
                title={who}
                subtitle={sig ? `Signed ${formatDisplayDate(sig.signed_at)}` : 'Not signed'}
                trailing={
                  sig ? (
                    <Button label="Clear" variant="plain" size="small" onPress={() => handleClearSignature(role)} />
                  ) : (
                    <Button
                      label={role === 'merchant' ? 'Sign' : 'Get Signature'}
                      variant="tinted"
                      size="small"
                      onPress={() => router.push({ pathname: '/modals/sign', params: { documentId: id, role } })}
                    />
                  )
                }
              />
            );
          })}
        </ListSection>

        <GroupedCard header="Activity">
          <ActivityLogList entries={activity} />
        </GroupedCard>
      </ScrollView>

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-card/60">
          <ActivityIndicator size="large" accessibilityLabel="Working" />
        </View>
      ) : null}

      <Modal visible={voidPromptVisible} transparent animationType="fade" onRequestClose={() => setVoidPromptVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="bg-card rounded-[26px] p-5 w-full gap-3">
            <Text className="text-title3 font-semibold text-label">
              Cancel This {docTypeLabel(document.doc_type)}?
            </Text>
            <Text className="text-body text-secondary">
              It stays on record but can&apos;t be edited, sent, or paid anymore.
            </Text>
            <FormField label="Reason" hint="Optional" value={voidReason} onChangeText={setVoidReason} autoFocus />
            <View className="flex-row gap-2 justify-end mt-1">
              <Button label="Don't Cancel" variant="plain" onPress={() => setVoidPromptVisible(false)} />
              <Button label={`Cancel ${docTypeLabel(document.doc_type)}`} variant="destructive" onPress={confirmVoid} />
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
    : {
        label: `Email ${docTypeLabel(document.doc_type)}`,
        caption: `Sends this ${document.doc_type} to the client by email.`,
        onPress: handlers.onEmail,
      };
}
