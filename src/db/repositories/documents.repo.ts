import type { SQLiteBindValue } from 'expo-sqlite';
import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import { computeDocumentTotals } from '../../lib/documentCalculations';
import { reserveNextDocNumber } from './docCounters.repo';
import { replaceLineItems } from './lineItems.repo';
import { logActivity } from './activityLog.repo';
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
  status?: DocStatus;
  search?: string;
}

export async function listDocuments(filter: DocumentListFilter = {}): Promise<DocumentListItem[]> {
  const clauses: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (filter.docType) {
    clauses.push('d.doc_type = ?');
    params.push(filter.docType);
  }
  if (filter.status) {
    clauses.push('d.status = ?');
    params.push(filter.status);
  }
  if (filter.search) {
    clauses.push('(d.doc_number LIKE ? OR c.display_name LIKE ?)');
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return db.getAllAsync<DocumentListItem>(
    `SELECT
       d.id, d.doc_type, d.doc_number, d.status, d.viewed_at, d.client_id,
       COALESCE(c.display_name, d.client_name_snapshot) AS client_name,
       d.due_date, d.total_minor, d.amount_paid_minor, d.currency_code,
       d.converted_to_document_id, d.created_at, d.updated_at
     FROM documents d
     LEFT JOIN clients c ON c.id = d.client_id
     ${where}
     ORDER BY d.created_at DESC`,
    params
  );
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  return db.getFirstAsync<DocumentRecord>('SELECT * FROM documents WHERE id = ?', [id]);
}

export async function createDraftDocument(
  docType: DocType,
  profile: BusinessProfile,
  clientId: string | null,
  clientNameSnapshot: string | null
): Promise<DocumentRecord> {
  const id = newId();
  const now = nowIso();
  const dueDate =
    docType === 'invoice'
      ? addDays(now, profile.default_payment_terms_days)
      : null;

  await db.withTransactionAsync(async () => {
    const docNumber = await reserveNextDocNumber(docType, profile);
    await db.runAsync(
      `INSERT INTO documents (
        id, doc_type, doc_number, status, client_id, client_name_snapshot,
        due_date, currency_code, created_at, updated_at
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
      [id, docType, docNumber, clientId, clientNameSnapshot, dueDate, profile.default_currency_code, now, now]
    );
    await logActivity(id, 'created');
  });

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

  await db.withTransactionAsync(async () => {
    await replaceLineItems(documentId, totals.lines);
    await db.runAsync(
      `UPDATE documents SET
        client_id = ?, client_name_snapshot = ?, issue_date = ?, due_date = ?, expiry_date = ?,
        notes = ?, terms_override = ?, discount_type = ?, discount_value = ?,
        subtotal_minor = ?, discount_amount_minor = ?, tax_total_minor = ?, total_minor = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        header.clientId,
        header.clientNameSnapshot,
        header.issueDate,
        header.dueDate,
        header.expiryDate,
        header.notes,
        header.termsOverride,
        header.discountType,
        header.discountValue,
        totals.subtotalMinor,
        totals.discountAmountMinor,
        totals.taxTotalMinor,
        totals.totalMinor,
        nowIso(),
        documentId,
      ]
    );
  });

  await logActivity(documentId, 'edited');
}

export async function issueDocument(id: string): Promise<void> {
  const doc = await getDocument(id);
  if (!doc || doc.status !== 'draft') return;
  const now = nowIso();
  await db.runAsync(
    `UPDATE documents SET status = 'issued', issue_date = COALESCE(issue_date, ?), updated_at = ? WHERE id = ?`,
    [now.slice(0, 10), now, id]
  );
  await logActivity(id, 'issued');
}

export async function markViewed(id: string): Promise<void> {
  await db.runAsync('UPDATE documents SET viewed_at = ?, updated_at = ? WHERE id = ? AND viewed_at IS NULL', [
    nowIso(),
    nowIso(),
    id,
  ]);
  await logActivity(id, 'viewed_marked');
}

export async function voidDocument(id: string, reason: string): Promise<void> {
  const now = nowIso();
  await db.runAsync(
    `UPDATE documents SET status = 'void', voided_at = ?, void_reason = ?, updated_at = ? WHERE id = ?`,
    [now, reason, now, id]
  );
  await logActivity(id, 'voided', reason);
}

export async function deleteDraftDocument(id: string): Promise<void> {
  const doc = await getDocument(id);
  if (!doc || doc.status !== 'draft') return;
  await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
}

export async function setPdfUri(id: string, pdfUri: string): Promise<void> {
  await db.runAsync('UPDATE documents SET pdf_uri = ?, updated_at = ? WHERE id = ?', [
    pdfUri,
    nowIso(),
    id,
  ]);
}

export async function convertEstimateToInvoice(
  estimateId: string,
  profile: BusinessProfile
): Promise<DocumentRecord> {
  const estimate = await getDocument(estimateId);
  if (!estimate) throw new Error('Estimate not found');
  if (estimate.doc_type !== 'estimate') throw new Error('Document is not an estimate');

  const lines = await db.getAllAsync<{
    catalog_item_id: string | null;
    description: string;
    quantity: number;
    unit_label: string | null;
    unit_price_minor: number;
    discount_type: DiscountType | null;
    discount_value: number | null;
    is_taxable: number;
    tax_bracket_id: string | null;
    tax_bracket_name_snapshot: string | null;
    tax_rate_bp: number;
  }>('SELECT * FROM line_items WHERE document_id = ? ORDER BY position ASC', [estimateId]);

  const invoiceId = newId();
  const now = nowIso();
  const dueDate = addDays(now, profile.default_payment_terms_days);

  await db.withTransactionAsync(async () => {
    const docNumber = await reserveNextDocNumber('invoice', profile);
    await db.runAsync(
      `INSERT INTO documents (
        id, doc_type, doc_number, status, client_id, client_name_snapshot, due_date,
        currency_code, notes, terms_override, converted_from_document_id, created_at, updated_at
      ) VALUES (?, 'invoice', ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        docNumber,
        estimate.client_id,
        estimate.client_name_snapshot,
        dueDate,
        estimate.currency_code,
        estimate.notes,
        estimate.terms_override,
        estimateId,
        now,
        now,
      ]
    );

    const editableLines: LineItemEditable[] = lines.map((l) => ({
      id: newId(),
      catalogItemId: l.catalog_item_id,
      description: l.description,
      quantity: l.quantity,
      unitLabel: l.unit_label,
      unitPriceMinor: l.unit_price_minor,
      discountType: l.discount_type,
      discountValue: l.discount_value,
      isTaxable: l.is_taxable === 1,
      taxBracketId: l.tax_bracket_id,
      taxBracketNameSnapshot: l.tax_bracket_name_snapshot,
      taxRateBp: l.tax_rate_bp,
    }));
    const totals = computeDocumentTotals(editableLines, estimate.discount_type, estimate.discount_value);
    await replaceLineItems(invoiceId, totals.lines);
    await db.runAsync(
      `UPDATE documents SET discount_type = ?, discount_value = ?, subtotal_minor = ?,
         discount_amount_minor = ?, tax_total_minor = ?, total_minor = ?, updated_at = ? WHERE id = ?`,
      [
        estimate.discount_type,
        estimate.discount_value,
        totals.subtotalMinor,
        totals.discountAmountMinor,
        totals.taxTotalMinor,
        totals.totalMinor,
        nowIso(),
        invoiceId,
      ]
    );

    await db.runAsync(
      'UPDATE documents SET converted_to_document_id = ?, updated_at = ? WHERE id = ?',
      [invoiceId, nowIso(), estimateId]
    );

    await logActivity(estimateId, 'converted_to_invoice', invoiceId);
    await logActivity(invoiceId, 'created', `Converted from estimate ${estimate.doc_number}`);
  });

  const created = await getDocument(invoiceId);
  if (!created) throw new Error('Failed to convert estimate to invoice');
  return created;
}

function addDays(fromIso: string, days: number): string {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
