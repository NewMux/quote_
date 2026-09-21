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

export async function getSettlement(id: string): Promise<Settlement | null> {
  return db.getFirstAsync<Settlement>('SELECT * FROM settlements WHERE id = ?', [id]);
}

export interface SettlementInput {
  method: SettlementMethod;
  amountMinor: number;
  settledDate: string;
  referenceNumber?: string | null;
  receiptPhotoUri?: string | null;
  notes?: string | null;
}

/** Recomputes amount_paid_minor from the settlements table and transitions the document's status
 * accordingly (issued/partially_paid/paid), including reverting to 'issued' if settlements were
 * removed/reduced enough to drop below fully paid. Must be called from within the same
 * db.withTransactionAsync block as the settlement insert/update/delete it follows. */
async function recalculateDocumentPayment(documentId: string): Promise<void> {
  const doc = await db.getFirstAsync<DocumentRecord>('SELECT * FROM documents WHERE id = ?', [documentId]);
  if (!doc) throw new Error('Document not found');

  const sumRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount_minor), 0) AS total FROM settlements WHERE document_id = ?',
    [documentId]
  );
  const amountPaidMinor = sumRow?.total ?? 0;

  let newStatus = doc.status;
  if (amountPaidMinor >= doc.total_minor && doc.total_minor > 0) {
    newStatus = 'paid';
  } else if (amountPaidMinor > 0) {
    newStatus = 'partially_paid';
  } else if (doc.status === 'paid' || doc.status === 'partially_paid') {
    newStatus = 'issued';
  }

  await db.runAsync('UPDATE documents SET amount_paid_minor = ?, status = ?, updated_at = ? WHERE id = ?', [
    amountPaidMinor,
    newStatus,
    nowIso(),
    documentId,
  ]);

  if (newStatus !== doc.status) {
    await logActivity(documentId, 'status_changed', newStatus);
  }
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

    await logActivity(documentId, 'settlement_logged');
    await recalculateDocumentPayment(documentId);
  });
}

export async function updateSettlement(
  id: string,
  documentId: string,
  input: SettlementInput
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE settlements SET method = ?, amount_minor = ?, settled_date = ?, reference_number = ?,
         receipt_photo_uri = ?, notes = ? WHERE id = ?`,
      [
        input.method,
        input.amountMinor,
        input.settledDate,
        input.referenceNumber ?? null,
        input.receiptPhotoUri ?? null,
        input.notes ?? null,
        id,
      ]
    );

    await logActivity(documentId, 'settlement_logged', 'updated');
    await recalculateDocumentPayment(documentId);
  });
}

export async function deleteSettlement(id: string, documentId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM settlements WHERE id = ?', [id]);
    await logActivity(documentId, 'settlement_logged', 'deleted');
    await recalculateDocumentPayment(documentId);
  });
}
