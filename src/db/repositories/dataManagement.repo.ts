import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';

/** Wipes every row this business owns and resets business_profile to fresh-signup defaults.
 * Re-seeds the default "No Tax" bracket the same way the signup trigger does, so the account
 * ends up in exactly the state it was in right after signing up. Not run inside a database
 * transaction (no client-side transaction API over PostgREST) — if a step fails partway through,
 * some data may already be gone. Acceptable for a user-initiated, rarely-used destructive action;
 * a Postgres RPC would be needed to make this atomic. */
export async function wipeAllData(): Promise<void> {
  const ownerId = requireOwnerId();

  for (const table of ['activity_logs', 'settlements', 'signatures', 'line_items', 'documents', 'clients', 'item_catalog', 'tax_brackets', 'doc_counters']) {
    const { error } = await supabase.from(table).delete().eq('owner_id', ownerId);
    if (error) throw error;
  }

  const now = nowIso();
  const { error: profileError } = await supabase
    .from('business_profile')
    .update({
      business_name: '',
      logo_uri: null,
      accent_color: '#2563EB',
      email: null,
      phone: null,
      address: null,
      tax_registration_number: null,
      payment_instructions: null,
      footer_terms: null,
      default_currency_code: 'USD',
      default_payment_terms_days: 14,
      estimate_prefix: 'EST-',
      invoice_prefix: 'INV-',
      number_padding: 3,
      reset_numbering_yearly: 0,
      updated_at: now,
    })
    .eq('id', ownerId);
  if (profileError) throw profileError;

  const { error: taxError } = await supabase
    .from('tax_brackets')
    .insert({ id: newId(), owner_id: ownerId, name: 'No Tax', rate_bp: 0, is_default: 1, created_at: now, updated_at: now });
  if (taxError) throw taxError;
}
