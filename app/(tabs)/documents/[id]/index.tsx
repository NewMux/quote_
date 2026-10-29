import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
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
import { resolvePaymentLink } from '../../../../src/lib/paymentLink';
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
import { t } from '../../../../src/lib/i18n';

interface MenuAction {
  label: string;
  symbol: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
}

export default function DocumentDetailScreen() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
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

  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const doc = await getDocument(id);
    if (!doc) {
      setLoadError(t('This document no longer exists.'));
      return;
    }
    setLoadError(null);
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
      reload().catch((err) => {
        setLoadError(err instanceof Error ? err.message : t('Something went wrong.'));
      });
    }, [reload])
  );

  // A document that was just created opens straight into its editor, with this screen underneath
  // so the editor's Done lands here, ready to issue or share.
  useEffect(() => {
    if (isNew !== '1') return;
    router.setParams({ isNew: undefined });
    router.push(`/documents/${id}/edit`);
  }, [id, isNew]);

  useEffect(() => {
    if (!document) return;
    const doc = document;
    const openEditor = () => router.push(`/documents/${id}/edit`);
    const buildHeaderItems = (): NativeStackHeaderItem[] => {
      const items: NativeStackHeaderItem[] = [
        {
          type: 'menu',
          label: t('More'),
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
        items.push({ type: 'button', label: t('Edit'), icon: { type: 'sfSymbol', name: 'pencil' }, onPress: openEditor });
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
                {canEdit(doc) ? <HeaderButton icon="pencil" label={t('Edit')} onPress={openEditor} /> : null}
                <HeaderButton icon="ellipsis.circle" label={t('More')} onPress={() => openActionsMenuRef.current()} />
              </View>
            ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, document, schedule]);

  if (!document && loadError) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped px-8 gap-4">
        <Text className="text-body text-secondary text-center">{loadError}</Text>
        <Button label={t('Try Again')} onPress={() => reload().catch(() => {})} />
      </View>
    );
  }

  if (!document) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel={t('Loading')} />
      </View>
    );
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (err) {
      Alert.alert(t('Something Went Wrong'), err instanceof Error ? err.message : t('Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  function checkReadyToSend(): string | null {
    if (lines.length === 0) return t('Add at least one item before sending this document.');
    if (!client && !document?.client_name_snapshot) return t('Add a client before sending this document.');
    return null;
  }

  async function handleIssue() {
    const problem = checkReadyToSend();
    if (problem) {
      Alert.alert(t('Not Ready to Send'), problem);
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
    const message = role === 'merchant' ? t('Your signature will be removed.') : t('The client’s signature will be removed.');
    Alert.alert(t('Clear Signature?'), message, [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Clear'), style: 'destructive', onPress: () => withBusy(() => deleteSignature(id, role)) },
    ]);
  }

  function handleVoid() {
    if (!document) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        document.doc_type === 'estimate' ? t('Cancel This Estimate?') : t('Cancel This Invoice?'),
        t("It stays on record but can't be edited, sent, or paid anymore. Add a reason if you like."),
        [
          { text: t('Don’t Cancel'), style: 'cancel' },
          {
            text: document.doc_type === 'estimate' ? t('Cancel Estimate') : t('Cancel Invoice'),
            style: 'destructive',
            onPress: (reason?: string) => withBusy(() => voidDocument(id, reason?.trim() || t('No reason given'))),
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
    await withBusy(() => voidDocument(id, voidReason.trim() || t('No reason given')));
  }

  function handleDelete() {
    if (!document) return;
    Alert.alert(
      t('Delete {number}?', { number: document.doc_number }),
      t("This permanently deletes the document with its line items, signatures, and payment records. This can't be undone."),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(id);
              router.replace('/(tabs)/documents');
            } catch (err) {
              Alert.alert(t('Couldn’t Delete'), err instanceof Error ? err.message : t('Something went wrong.'));
            }
          },
        },
      ]
    );
  }

  /** The invoice's resolved pay link, when there's a balance left to pay. */
  function currentPaymentLink(): string | null {
    if (!document || document.doc_type !== 'invoice' || document.status === 'void') return null;
    const balance = document.total_minor - document.amount_paid_minor;
    if (balance <= 0) return null;
    return resolvePaymentLink(document.payment_link || profile?.payment_link, {
      amountMinor: balance,
      currencyCode: document.currency_code,
      docNumber: document.doc_number,
    });
  }

  async function handleSharePaymentLink() {
    const link = currentPaymentLink();
    if (!document || !link) return;
    const balance = formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code);
    await Share.share({ message: t('Invoice {number} ({balance}). You can pay online here: {link}', { number: document.doc_number, balance, link }) });
  }

  /** The document's secondary actions: a native menu on iOS, a dialog list on Android. */
  function getMenuActions() {
    if (!document) return [];
    const actions: MenuAction[] = [
      { label: t('Share PDF'), symbol: 'square.and.arrow.up', onPress: () => handleGeneratePdfAnd('view') },
    ];
    if (currentPaymentLink()) {
      actions.push({ label: t('Share Payment Link'), symbol: 'link', onPress: handleSharePaymentLink });
    }
    if (canMarkViewed(document)) {
      actions.push({ label: t('Mark as Viewed'), symbol: 'eye', onPress: handleMarkViewed });
    }
    if (document.doc_type === 'invoice' && document.status !== 'void') {
      actions.push({
        label: schedule ? t('Edit Recurring') : t('Make Recurring'),
        symbol: 'repeat',
        onPress: () => router.push({ pathname: '/modals/recurring', params: { documentId: id } }),
      });
    }
    if (canVoid(document)) {
      actions.push({
        label: document.doc_type === 'estimate' ? t('Cancel Estimate') : t('Cancel Invoice'),
        symbol: 'xmark.circle',
        onPress: handleVoid,
        destructive: true,
      });
    }
    if (canDelete(document)) {
      actions.push({
        label: document.doc_type === 'estimate' ? t('Delete Estimate') : t('Delete Invoice'),
        symbol: 'trash',
        onPress: handleDelete,
        destructive: true,
      });
    }
    return actions;
  }

  function openActionsMenu() {
    Alert.alert(document?.doc_number ?? t('Document'), undefined, [
      ...getMenuActions().map((a) => ({
        text: a.label,
        style: a.destructive ? ('destructive' as const) : undefined,
        onPress: a.onPress,
      })),
      { text: t('Cancel'), style: 'cancel' as const },
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
      Alert.alert(t('Not Ready to Send'), problem);
      return;
    }
    const docType = document.doc_type;
    const docNumber = document.doc_number;
    const overdue = isOverdue(document);
    const payLink = currentPaymentLink();
    const payLine = payLink ? `\n\n${t('Pay online: {link}', { link: payLink })}` : '';
    await withBusy(async () => {
      const pdfUri = await generateDocumentPdf(id);
      if (action === 'view') {
        await sharePdf(id, pdfUri);
      } else {
        const label = docType === 'estimate' ? t('Estimate') : t('Invoice');
        await emailPdf({
          documentId: id,
          pdfUri,
          recipientEmail: client?.email ?? null,
          subject: overdue ? t('Payment Reminder: {type} {number}', { type: label, number: docNumber }) : `${label} ${docNumber}`,
          body: (overdue
            ? t(
                'This is a friendly reminder that {type} {number} for {amount} is overdue. Please arrange payment at your earliest convenience.\n\nThank you!',
                {
                  type: label.toLowerCase(),
                  number: docNumber,
                  amount: formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code),
                }
              )
            : t('Please find attached {type} {number}.', { type: label.toLowerCase(), number: docNumber })) + payLine,
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

  const clientName = client?.display_name ?? document.client_name_snapshot ?? t('No Client');
  const balanceMinor = document.total_minor - document.amount_paid_minor;
  const amountLabel = document.doc_type === 'invoice' ? t('Balance Due') : t('Total');
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
          {document.status !== 'void' ? (
            <View className="self-stretch mt-3">
              <Button
                label={t('Share PDF')}
                icon="square.and.arrow.up"
                variant="tinted"
                onPress={() => handleGeneratePdfAnd('view')}
                accessibilityHint={t('Opens the share sheet to send, print or save the PDF to Files')}
              />
            </View>
          ) : null}
        </View>

        {document.status === 'void' ? (
          <ListSection header={t('Canceled')}>
            <ListRow
              title={document.void_reason ?? t('No reason given')}
              subtitle={document.voided_at ? t('On {date}', { date: formatDisplayDate(document.voided_at) }) : undefined}
            />
          </ListSection>
        ) : null}

        <ListSection>
          <ListRow
            title={t('Client')}
            value={clientName}
            onPress={client ? () => router.push(`/clients/${client.id}`) : undefined}
          />
          <ListRow title={t('Issued')} value={document.issue_date ? formatDisplayDate(document.issue_date) : t('Not Yet')} />
          <ListRow
            title={document.doc_type === 'invoice' ? t('Payment Due') : t('Valid Until')}
            value={dueDate ? formatDisplayDate(dueDate) : '—'}
            valueClassName={isOverdue(document) ? 'text-destructive' : undefined}
          />
          {schedule ? (
            <ListRow
              icon="repeat"
              title={t('Repeats')}
              subtitle={describeSchedule(schedule.frequency, schedule.next_run_date)}
              onPress={() => router.push({ pathname: '/modals/recurring', params: { documentId: id } })}
              accessibilityHint={t('Edit the repeat schedule')}
            />
          ) : null}
        </ListSection>

        <ListSection header={t('Items')}>
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
            <ListRow title={t('No items yet')} subtitle={canEdit(document) ? t('Tap Edit to add some.') : undefined} />
          )}
        </ListSection>

        <ListSection
          footer={
            !canEdit(document) && document.status !== 'void'
              ? t('Editing is locked because this {type} has been issued.', { type: docTypeLabel(document.doc_type).toLowerCase() })
              : undefined
          }
        >
          <ListRow title={t('Subtotal')} value={formatMinor(document.subtotal_minor, document.currency_code)} />
          {document.discount_amount_minor > 0 ? (
            <ListRow title={t('Discount')} value={formatMinor(-document.discount_amount_minor, document.currency_code)} />
          ) : null}
          <ListRow
            title={getTaxLabel(lines.map((l) => ({ isTaxable: l.is_taxable === 1, taxName: l.tax_bracket_name_snapshot })))}
            value={formatMinor(document.tax_total_minor, document.currency_code)}
          />
          {document.amount_paid_minor > 0 ? (
            <ListRow title={t('Total')} value={formatMinor(document.total_minor, document.currency_code)} />
          ) : null}
          {document.amount_paid_minor > 0 ? (
            <ListRow title={t('Paid')} value={formatMinor(-document.amount_paid_minor, document.currency_code)} />
          ) : null}
          <ListRow title={amountLabel} value={formatMinor(balanceMinor, document.currency_code)} emphasized />
        </ListSection>

        {settlements.length > 0 ? (
          <ListSection header={t('Payments')} footer={t('Tap a payment to edit or delete it.')}>
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

        <ListSection header={t('Signatures')}>
          {(['merchant', 'client'] as const).map((role) => {
            const sig = signatures.find((s) => s.signer_role === role);
            const who = role === 'merchant' ? t('You') : t('Client');
            return (
              <ListRow
                key={role}
                icon="signature"
                iconColor={sig ? undefined : colors.secondary}
                title={who}
                subtitle={sig ? t('Signed {date}', { date: formatDisplayDate(sig.signed_at) }) : t('Not signed')}
                trailing={
                  sig ? (
                    <Button label={t('Clear')} variant="plain" size="small" onPress={() => handleClearSignature(role)} />
                  ) : (
                    <Button
                      label={role === 'merchant' ? t('Sign') : t('Get Signature')}
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

        <GroupedCard header={t('Activity')}>
          <ActivityLogList entries={activity} />
        </GroupedCard>
      </ScrollView>

      {busy ? (
        <View className="absolute inset-0 items-center justify-center bg-card/60">
          <ActivityIndicator size="large" accessibilityLabel={t('Working')} />
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
            <FormField label={t('Reason')} hint={t('Optional')} value={voidReason} onChangeText={setVoidReason} autoFocus />
            <View className="flex-row gap-2 justify-end mt-1">
              <Button label={t("Don't Cancel")} variant="plain" onPress={() => setVoidPromptVisible(false)} />
              <Button label={document.doc_type === 'estimate' ? t('Cancel Estimate') : t('Cancel Invoice')} variant="destructive" onPress={confirmVoid} />
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
      label: document.doc_type === 'estimate' ? t('Issue Estimate') : t('Issue Invoice'),
      caption: t('Finalizes the number and locks editing.'),
      onPress: handlers.onIssue,
    };
  }
  if (canConvertToInvoice(document)) {
    return {
      label: t('Convert to Invoice'),
      caption: t('Turn this accepted estimate into a billable invoice.'),
      onPress: handlers.onConvert,
    };
  }
  if (canLogSettlement(document)) {
    return { label: t('Log Payment'), caption: t('Record a payment you received for this invoice.'), onPress: handlers.onLogPayment };
  }
  if (document.status === 'void') return null;
  return isOverdue(document)
    ? { label: t('Send Reminder'), caption: t('Emails the client a payment reminder.'), onPress: handlers.onEmail }
    : {
        label: document.doc_type === 'estimate' ? t('Email Estimate') : t('Email Invoice'),
        caption:
          document.doc_type === 'estimate'
            ? t('Sends this estimate to the client by email.')
            : t('Sends this invoice to the client by email.'),
        onPress: handlers.onEmail,
      };
}
