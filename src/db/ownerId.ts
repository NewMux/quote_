import { useAuthStore } from '../stores/useAuthStore';

/** Every repo function that reads/writes user-owned data needs the signed-in user's id to scope
 * the query — RLS enforces isolation server-side regardless, but explicit owner_id filters let
 * Postgres use the owner_id indexes and give a clear error instead of an empty result if the
 * session is somehow missing. Repo files are plain modules (not components), so this reads
 * straight from the Zustand store's state rather than a hook. */
export function requireOwnerId(): string {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) throw new Error('Not signed in.');
  return userId;
}
