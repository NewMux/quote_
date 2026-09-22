import { supabase } from '../../lib/supabase';
import { formatDocNumber } from '../../lib/docNumber';
import { requireOwnerId } from '../ownerId';
import type { BusinessProfile, DocType } from '../../types/models';

/** Reserves and returns the next formatted document number. Not run inside a database
 * transaction with the document insert that follows it (no client-side transaction API over
 * PostgREST) — a read-then-write, same class of race as any client-side counter without a
 * Postgres RPC. Low risk for this app's single-device, sequential usage; worth converting to an
 * RPC (e.g. a SQL function using `SELECT ... FOR UPDATE`) if that ever changes. */
export async function reserveNextDocNumber(docType: DocType, profile: BusinessProfile): Promise<string> {
  const ownerId = requireOwnerId();
  const yearBucket = profile.reset_numbering_yearly ? new Date().getFullYear() : 0;
  const prefix = docType === 'estimate' ? profile.estimate_prefix : profile.invoice_prefix;

  const { data: existing, error: selectError } = await supabase
    .from('doc_counters')
    .select('next_number')
    .eq('owner_id', ownerId)
    .eq('doc_type', docType)
    .eq('year_bucket', yearBucket)
    .maybeSingle();
  if (selectError) throw selectError;

  const nextNumber = existing?.next_number ?? 1;

  if (existing) {
    const { error } = await supabase
      .from('doc_counters')
      .update({ next_number: nextNumber + 1 })
      .eq('owner_id', ownerId)
      .eq('doc_type', docType)
      .eq('year_bucket', yearBucket);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('doc_counters')
      .insert({ owner_id: ownerId, doc_type: docType, year_bucket: yearBucket, next_number: 2 });
    if (error) throw error;
  }

  return formatDocNumber(prefix, nextNumber, profile.number_padding, yearBucket);
}
