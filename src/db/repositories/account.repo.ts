import { supabase } from '../../lib/supabase';

/** Permanently deletes the signed-in business's entire account — every database row, every
 * stored file, and their auth.users row — via a server-side Edge Function. This can't run
 * client-side: deleting an auth user needs the service_role key, which never reaches the app. */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) {
    // On a non-2xx response the function's own message is in the response body, not the error.
    const context = (error as { context?: Response }).context;
    const body = await context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
}
