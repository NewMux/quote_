import { supabase } from '../../lib/supabase';
import type { DocType } from '../../types/models';

/** Reserves and returns the next formatted document number in one atomic database call, so two
 * quick creates can never be handed the same number. Formatting (prefix, yearly bucket, padding)
 * happens server-side from the business profile, mirroring src/lib/docNumber.ts. */
export async function reserveNextDocNumber(docType: DocType): Promise<string> {
  const { data, error } = await supabase.rpc('reserve_doc_number', { p_doc_type: docType });
  if (error) throw error;
  return data as string;
}
