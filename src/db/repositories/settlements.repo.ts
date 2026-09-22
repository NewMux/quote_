import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import { logActivity } from './activityLog.repo';
import type { DocumentRecord, Settlement, SettlementMethod } from '../../types/models';

export async function listSettlements(documentId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('document_id', documentId)
    .order('settled_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSettlement(id: string): Promise<Settlement | null> {
  const { data, error } = await supabase.from('settlements').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
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
 * removed/reduced enough to drop below fully paid. Not run inside a database transaction with the
 * settlement write that precedes it — see the docCounters.repo.ts note on this app's accepted
 * read-then-write trade-off without a Postgres RPC. */
async function recalculateDocumentPayment(documentId: string): Promise<void> {
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle<DocumentRecord>();
  if (docError) throw docError;
  if (!doc) throw new Error('Document not found');

  const { data: settlements, error: settlementsError } = await supabase
    .from('settlements')
    .select('amount_minor')
    .eq('document_id', documentId);
  if (settlementsError) throw settlementsError;
  const amountPaidMinor = (settlements ?? []).reduce((sum, s) => sum + s.amount_minor, 0);

  let newStatus = doc.status;
  if (amountPaidMinor >= doc.total_minor && doc.total_minor > 0) {
    newStatus = 'paid';
  } else if (amountPaidMinor > 0) {
    newStatus = 'partially_paid';
  } else if (doc.status === 'paid' || doc.status === 'partially_paid') {
    newStatus = 'issued';
  }

  const { error } = await supabase
    .from('documents')
    .update({ amount_paid_minor: amountPaidMinor, status: newStatus, updated_at: nowIso() })
    .eq('id', documentId);
  if (error) throw error;

  if (newStatus !== doc.status) {
    await logActivity(documentId, 'status_changed', newStatus);
  }
}

export async function createSettlement(documentId: string, input: SettlementInput): Promise<void> {
  const ownerId = requireOwnerId();
  const { error } = await supabase.from('settlements').insert({
    id: newId(),
    owner_id: ownerId,
    document_id: documentId,
    method: input.method,
    amount_minor: input.amountMinor,
    settled_date: input.settledDate,
    reference_number: input.referenceNumber ?? null,
    receipt_photo_uri: input.receiptPhotoUri ?? null,
    notes: input.notes ?? null,
    created_at: nowIso(),
  });
  if (error) throw error;

  await logActivity(documentId, 'settlement_logged');
  await recalculateDocumentPayment(documentId);
}

export async function updateSettlement(id: string, documentId: string, input: SettlementInput): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .update({
      method: input.method,
      amount_minor: input.amountMinor,
      settled_date: input.settledDate,
      reference_number: input.referenceNumber ?? null,
      receipt_photo_uri: input.receiptPhotoUri ?? null,
      notes: input.notes ?? null,
    })
    .eq('id', id);
  if (error) throw error;

  await logActivity(documentId, 'settlement_logged', 'updated');
  await recalculateDocumentPayment(documentId);
}

export async function deleteSettlement(id: string, documentId: string): Promise<void> {
  const { error } = await supabase.from('settlements').delete().eq('id', id);
  if (error) throw error;

  await logActivity(documentId, 'settlement_logged', 'deleted');
  await recalculateDocumentPayment(documentId);
}
