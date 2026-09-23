import { supabase } from '../../lib/supabase';

/** Wipes every row this business owns and resets business_profile to fresh-signup defaults
 * (re-seeding the default "No Tax" bracket), in one database transaction — so a failure partway
 * through can't leave the account half-erased. Stored files are removed separately by
 * wipeAllFiles() in src/lib/fileStorage.ts. */
export async function wipeAllData(): Promise<void> {
  const { error } = await supabase.rpc('wipe_all_data');
  if (error) throw error;
}
