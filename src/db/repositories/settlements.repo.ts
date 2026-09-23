import { supabase } from '../../lib/supabase';
import { deleteFileIfExists } from '../../lib/fileStorage';
import { cancelOverdueReminder, scheduleOverdueReminder } from '../../lib/notifications';
import type { DocStatus, DocType, Settlement, SettlementMethod } from '../../types/models';

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

/** What each payment RPC returns: the document's status after its balance was recalculated in
 * the same transaction as the payment write. */
interface PaymentResult {
  status: DocStatus;
  doc_type: DocType;
  doc_number: string;
  due_date: string | null;
}

function settlementParams(input: SettlementInput) {
  return {
    p_method: input.method,
    p_amount_minor: input.amountMinor,
    p_settled_date: input.settledDate,
    p_reference_number: input.referenceNumber ?? null,
    p_receipt_photo_uri: input.receiptPhotoUri ?? null,
    p_notes: input.notes ?? null,
  };
}

async function syncReminder(documentId: string, result: PaymentResult): Promise<void> {
  if (result.doc_type !== 'invoice') return;
  if (result.status === 'paid') {
    await cancelOverdueReminder(documentId);
  } else if (result.status === 'issued' || result.status === 'partially_paid') {
    await scheduleOverdueReminder({ id: documentId, doc_number: result.doc_number, due_date: result.due_date });
  }
}

export async function createSettlement(documentId: string, input: SettlementInput): Promise<void> {
  const { data, error } = await supabase.rpc('create_settlement', {
    p_document_id: documentId,
    ...settlementParams(input),
  });
  if (error) throw error;
  await syncReminder(documentId, data as PaymentResult);
}

export async function updateSettlement(id: string, documentId: string, input: SettlementInput): Promise<void> {
  const previous = await getSettlement(id);
  const { data, error } = await supabase.rpc('update_settlement', {
    p_settlement_id: id,
    ...settlementParams(input),
  });
  if (error) throw error;
  const newReceipt = input.receiptPhotoUri ?? null;
  if (previous?.receipt_photo_uri && previous.receipt_photo_uri !== newReceipt) {
    await deleteFileIfExists(previous.receipt_photo_uri);
  }
  await syncReminder(documentId, data as PaymentResult);
}

export async function deleteSettlement(id: string, documentId: string): Promise<void> {
  const previous = await getSettlement(id);
  const { data, error } = await supabase.rpc('delete_settlement', { p_settlement_id: id });
  if (error) throw error;
  await deleteFileIfExists(previous?.receipt_photo_uri);
  await syncReminder(documentId, data as PaymentResult);
}
