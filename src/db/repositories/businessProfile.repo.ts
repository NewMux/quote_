import { supabase } from '../../lib/supabase';
import { nowIso } from '../../lib/id';
import { deleteFileIfExists } from '../../lib/fileStorage';
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

  const replacingLogo = 'logo_uri' in patch;
  let previousLogo: string | null = null;
  if (replacingLogo) {
    const { data } = await supabase.from('business_profile').select('logo_uri').eq('id', ownerId).maybeSingle();
    previousLogo = data?.logo_uri ?? null;
  }

  const { error } = await supabase
    .from('business_profile')
    .update({ ...patch, updated_at: nowIso() })
    .eq('id', ownerId);
  if (error) throw error;

  if (replacingLogo && previousLogo && previousLogo !== (patch.logo_uri ?? null)) {
    await deleteFileIfExists(previousLogo);
  }
}
