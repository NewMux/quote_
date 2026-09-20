import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import { logActivity } from './activityLog.repo';
import type { DocumentRecord, Settlement, SettlementMethod } from '../../types/models';

export async function listSettlements(documentId: string): Promise<Settlement[]> {
  return db.getAllAsync<Settlement>(
    'SELECT * FROM settlements WHERE document_id = ? ORDER BY settled_date DESC, created_at DESC',
    [documentId]
  );
}

export interface SettlementInput {
  method: SettlementMethod;
  amountMinor: number;
  settledDate: string;
  referenceNumber?: string | null;
  receiptPhotoUri?: string | null;
  notes?: string | null;
}

/** Inserts a settlement, recomputes amount_paid_minor, and auto-transitions the document's status
 * (issued/partially_paid -> partially_paid or paid) — all inside one transaction. */
export async function createSettlement(documentId: string, input: SettlementInput): Promise<void> {
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO settlements (id, document_id, method, amount_minor, settled_date, reference_number, receipt_photo_uri, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        documentId,
        input.method,
        input.amountMinor,
        input.settledDate,
        input.referenceNumber ?? null,
        input.receiptPhotoUri ?? null,
        input.notes ?? null,
        now,
      ]
    );

    const doc = await db.getFirstAsync<DocumentRecord>('SELECT * FROM documents WHERE id = ?', [
      documentId,
    ]);
    if (!doc) throw new Error('Document not found');

    const sumRow = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount_minor), 0) AS total FROM settlements WHERE document_id = ?',
      [documentId]
    );
    const amountPaidMinor = sumRow?.total ?? 0;
    const newStatus =
      amountPaidMinor >= doc.total_minor ? 'paid' : amountPaidMinor > 0 ? 'partially_paid' : doc.status;

    await db.runAsync(
      'UPDATE documents SET amount_paid_minor = ?, status = ?, updated_at = ? WHERE id = ?',
      [amountPaidMinor, newStatus, nowIso(), documentId]
    );

    await logActivity(documentId, 'settlement_logged');
    if (newStatus !== doc.status) {
      await logActivity(documentId, 'status_changed', newStatus);
    }
  });
}
