// Deletes the calling business's entire account: every stored file, then the auth.users row,
// which cascades to every owner-scoped database row (each table's owner_id references
// auth.users(id) on delete cascade). This can only run server-side — deleting an auth user
// requires the service_role key, which must never reach the client bundle. verify_jwt is enabled
// on this function (see deploy config), so Supabase already rejects any request without a valid
// session token before this code runs; the token is then used here only to look up whose account
// to delete, never trusted for anything else.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const STORAGE_BUCKET = 'user-files';
const PAGE_SIZE = 1000;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Every file path under a folder, including nested folders. Storage's list() returns one level
 * at a time and only 100 entries unless asked for more, so it's walked and paged. */
async function listAllPaths(admin: SupabaseClient, folder: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .list(folder, { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`Failed listing ${folder}: ${error.message}`);
    for (const entry of data) {
      const path = `${folder}/${entry.name}`;
      // Folders come back with no id.
      if (entry.id) paths.push(path);
      else paths.push(...(await listAllPaths(admin, path)));
    }
    if (data.length < PAGE_SIZE) return paths;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
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
    // Files first: once the user is gone nothing could find (or clean up) their folder. If this
    // fails, the account is untouched and the user can simply try again.
    const paths = await listAllPaths(admin, userId);
    for (let i = 0; i < paths.length; i += PAGE_SIZE) {
      const { error } = await admin.storage.from(STORAGE_BUCKET).remove(paths.slice(i, i + PAGE_SIZE));
      if (error) throw new Error(`Failed deleting files: ${error.message}`);
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw new Error(`Failed deleting auth user: ${deleteUserError.message}`);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
