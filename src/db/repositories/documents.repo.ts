import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { computeDocumentTotals } from '../../lib/documentCalculations';
import { deleteFileIfExists } from '../../lib/fileStorage';
import { cancelOverdueReminder, scheduleOverdueReminder } from '../../lib/notifications';
import { requireOwnerId } from '../ownerId';
import { reserveNextDocNumber } from './docCounters.repo';
import { logActivity } from './activityLog.repo';
import { listSignatures } from './signatures.repo';
import { listSettlements } from './settlements.repo';
import type {
  BusinessProfile,
  DiscountType,
  DocStatus,
  DocType,
  DocumentListItem,
  DocumentRecord,
  LineItemEditable,
} from '../../types/models';

export interface DocumentListFilter {
  docType?: DocType;
  status?: DocStatus | 'overdue';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export async function listDocuments(filter: DocumentListFilter = {}): Promise<DocumentListItem[]> {
  const ownerId = requireOwnerId();
  let query = supabase
    .from('documents')
    .select(
      'id, doc_type, doc_number, status, viewed_at, client_id, client_name_snapshot, due_date, total_minor, amount_paid_minor, currency_code, converted_to_document_id, created_at, updated_at, clients(display_name)'
    )
    .eq('owner_id', ownerId);

  if (filter.docType) query = query.eq('doc_type', filter.docType);
  if (filter.status === 'overdue') {
    query = query
      .in('status', ['issued', 'partially_paid'])
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString().slice(0, 10));
  } else if (filter.status) {
    query = query.eq('status', filter.status);
  }
  if (filter.clientId) query = query.eq('client_id', filter.clientId);
  if (filter.dateFrom) query = query.gte('issue_date', filter.dateFrom);
  if (filter.dateTo) query = query.lte('issue_date', filter.dateTo);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    doc_type: DocType;
    doc_number: string;
    status: DocStatus;
    viewed_at: string | null;
    client_id: string | null;
    client_name_snapshot: string | null;
    due_date: string | null;
    total_minor: number;
    amount_paid_minor: number;
    currency_code: string;
    converted_to_document_id: string | null;
    created_at: string;
    updated_at: string;
    clients: { display_name: string } | { display_name: string }[] | null;
  };

  let rows: DocumentListItem[] = ((data ?? []) as Row[]).map((d) => {
    const client = Array.isArray(d.clients) ? d.clients[0] : d.clients;
    return {
      id: d.id,
      doc_type: d.doc_type,
      doc_number: d.doc_number,
      status: d.status,
      viewed_at: d.viewed_at,
      client_id: d.client_id,
      client_name: client?.display_name ?? d.client_name_snapshot,
      due_date: d.due_date,
      total_minor: d.total_minor,
      amount_paid_minor: d.amount_paid_minor,
      currency_code: d.currency_code,
      converted_to_document_id: d.converted_to_document_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  });

  // PostgREST can't express "amount_paid_minor < total_minor" as a column-to-column filter, and
  // an OR search across the document's own column and the joined client's name isn't reliably
  // expressible through the query builder either — both are filtered here instead, following the
  // same "small dataset, filter in JS" approach already used in reports.repo.ts.
  if (filter.status === 'overdue') {
    rows = rows.filter((r) => r.amount_paid_minor < r.total_minor);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter(
      (r) => r.doc_number.toLowerCase().includes(q) || (r.client_name ?? '').toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDraftDocument(
  docType: DocType,
  profile: BusinessProfile,
  clientId: string | null,
  clientNameSnapshot: string | null
): Promise<DocumentRecord> {
  const ownerId = requireOwnerId();
  const id = newId();
  const now = nowIso();
  const dueDate = docType === 'invoice' ? addDays(now, profile.default_payment_terms_days) : null;

  const docNumber = await reserveNextDocNumber(docType);
  const { error } = await supabase.from('documents').insert({
    id,
    owner_id: ownerId,
    doc_type: docType,
    doc_number: docNumber,
    status: 'draft',
    client_id: clientId,
    client_name_snapshot: clientNameSnapshot,
    due_date: dueDate,
    currency_code: profile.default_currency_code,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  await logActivity(id, 'created');

  const created = await getDocument(id);
  if (!created) throw new Error('Failed to create document');
  return created;
}

export interface DocumentHeaderInput {
  clientId: string | null;
  clientNameSnapshot: string | null;
  issueDate: string | null;
  dueDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  termsOverride: string | null;
  discountType: DiscountType | null;
  discountValue: number | null;
}

export async function saveDocumentEdit(
  documentId: string,
  header: DocumentHeaderInput,
  lines: LineItemEditable[]
): Promise<void> {
  const totals = computeDocumentTotals(lines, header.discountType, header.discountValue);

  // The line replacement, header/totals update and activity entry land in one transaction.
  const { error } = await supabase.rpc('save_document_edit', {
    p_document_id: documentId,
    p_header: {
      client_id: header.clientId,
      client_name_snapshot: header.clientNameSnapshot,
      issue_date: header.issueDate,
      due_date: header.dueDate,
      expiry_date: header.expiryDate,
      notes: header.notes,
      terms_override: header.termsOverride,
      discount_type: header.discountType,
      discount_value: header.discountValue,
      subtotal_minor: totals.subtotalMinor,
      discount_amount_minor: totals.discountAmountMinor,
      tax_total_minor: totals.taxTotalMinor,
      total_minor: totals.totalMinor,
    },
    p_lines: totals.lines.map((line, index) => ({
      id: line.id,
      catalog_item_id: line.catalogItemId,
      position: index,
      description: line.description,
      quantity: line.quantity,
      unit_label: line.unitLabel,
      unit_price_minor: line.unitPriceMinor,
      discount_type: line.discountType,
      discount_value: line.discountValue,
      is_taxable: line.isTaxable ? 1 : 0,
      tax_bracket_id: line.taxBracketId,
      tax_bracket_name_snapshot: line.taxBracketNameSnapshot,
      tax_rate_bp: line.taxRateBp,
      line_subtotal_minor: line.lineSubtotalMinor,
      line_discount_minor: line.lineDiscountMinor,
      line_tax_minor: line.lineTaxMinor,
      line_total_minor: line.lineTotalMinor,
    })),
  });
  if (error) throw error;
}

export async function issueDocument(id: string): Promise<void> {
  const doc = await getDocument(id);
  if (!doc || doc.status !== 'draft') return;
  const now = nowIso();
  const { error } = await supabase
    .from('documents')
    .update({ status: 'issued', issue_date: doc.issue_date ?? now.slice(0, 10), updated_at: now })
    .eq('id', id);
  if (error) throw error;
  await logActivity(id, 'issued');
  if (doc.doc_type === 'invoice') {
    await scheduleOverdueReminder({ id, doc_number: doc.doc_number, due_date: doc.due_date });
  }
}

export async function markViewed(id: string): Promise<void> {
  const now = nowIso();
  const { error } = await supabase
    .from('documents')
    .update({ viewed_at: now, updated_at: now })
    .eq('id', id)
    .is('viewed_at', null);
  if (error) throw error;
  await logActivity(id, 'viewed_marked');
}

export async function voidDocument(id: string, reason: string): Promise<void> {
  const now = nowIso();
  const { error } = await supabase
    .from('documents')
    .update({ status: 'void', voided_at: now, void_reason: reason, updated_at: now })
    .eq('id', id);
  if (error) throw error;
  await logActivity(id, 'voided', reason);
  await cancelOverdueReminder(id);
}

export async function deleteDocument(id: string): Promise<void> {
  const doc = await getDocument(id);
  if (!doc || doc.converted_to_document_id) return;

  const [signatures, settlements] = await Promise.all([listSignatures(id), listSettlements(id)]);
  await deleteFileIfExists(doc.pdf_uri);
  await Promise.all(signatures.map((sig) => deleteFileIfExists(sig.signature_image_uri)));
  await Promise.all(settlements.map((settlement) => deleteFileIfExists(settlement.receipt_photo_uri)));

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
  await cancelOverdueReminder(id);
}

export async function setPdfUri(id: string, pdfUri: string): Promise<void> {
  const { error } = await supabase.from('documents').update({ pdf_uri: pdfUri, updated_at: nowIso() }).eq('id', id);
  if (error) throw error;
}

export async function convertEstimateToInvoice(
  estimateId: string,
  profile: BusinessProfile
): Promise<DocumentRecord> {
  // One transaction: locks the estimate (so a double-tap can't convert it twice), reserves the
  // invoice number, copies header/totals/lines, links both documents and logs both sides.
  const { data: invoiceId, error } = await supabase.rpc('convert_estimate_to_invoice', {
    p_estimate_id: estimateId,
    p_due_date: addDays(nowIso(), profile.default_payment_terms_days),
  });
  if (error) throw error;

  const created = await getDocument(invoiceId as string);
  if (!created) throw new Error('Failed to convert estimate to invoice');
  return created;
}

function addDays(fromIso: string, days: number): string {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
