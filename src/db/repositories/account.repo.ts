import { supabase } from '../../lib/supabase';

/** Permanently deletes the signed-in business's entire account — every database row, every
 * stored file, and their auth.users row — via a server-side Edge Function. This can't run
 * client-side: deleting an auth user needs the service_role key, which never reaches the app. */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
