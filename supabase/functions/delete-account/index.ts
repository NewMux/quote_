// Deletes the calling business's entire account: every owner-scoped database row, every stored
// file, and the auth.users row itself. This can only run server-side — deleting an auth user
// requires the service_role key, which must never reach the client bundle. verify_jwt is enabled
// on this function (see deploy config), so Supabase already rejects any request without a valid
// session token before this code runs; the token is then used here only to look up whose account
// to delete, never trusted for anything else.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const OWNER_SCOPED_TABLES = [
  'recurring_schedules',
  'activity_logs',
  'settlements',
  'signatures',
  'line_items',
  'documents',
  'clients',
  'item_catalog',
  'tax_brackets',
  'doc_counters',
];

const STORAGE_BUCKET = 'user-files';
const STORAGE_CATEGORIES = ['branding', 'signatures', 'receipts', 'pdfs', 'client-photos'];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identify the caller from their own token — never accept a user id from the request body.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Not authenticated' }, 401);
  }
  const userId = callerData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    for (const table of OWNER_SCOPED_TABLES) {
      const { error } = await admin.from(table).delete().eq('owner_id', userId);
      if (error) throw new Error(`Failed deleting ${table}: ${error.message}`);
    }

    const { error: profileError } = await admin.from('business_profile').delete().eq('id', userId);
    if (profileError) throw new Error(`Failed deleting business_profile: ${profileError.message}`);

    for (const category of STORAGE_CATEGORIES) {
      const { data: files } = await admin.storage.from(STORAGE_BUCKET).list(`${userId}/${category}`);
      if (files && files.length > 0) {
        const paths = files.map((file) => `${userId}/${category}/${file.name}`);
        await admin.storage.from(STORAGE_BUCKET).remove(paths);
      }
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw new Error(`Failed deleting auth user: ${deleteUserError.message}`);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
