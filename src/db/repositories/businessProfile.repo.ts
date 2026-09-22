import { supabase } from '../../lib/supabase';
import { nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type { BusinessProfile } from '../../types/models';

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const ownerId = requireOwnerId();
  const { data, error } = await supabase.from('business_profile').select('*').eq('id', ownerId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Business profile row missing — the signup trigger did not seed it.');
  return data;
}

export async function updateBusinessProfile(
  patch: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const ownerId = requireOwnerId();
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase
    .from('business_profile')
    .update({ ...patch, updated_at: nowIso() })
    .eq('id', ownerId);
  if (error) throw error;
}
