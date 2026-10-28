import type { User } from '@supabase/supabase-js';

/** Signing up with an address that already has an account doesn't fail: Supabase answers with a
 * success response whose user has no identities, and sends no email, so strangers can't find out
 * who has an account. The app has to notice that itself, or it tells the person a confirmation
 * email is on its way when none will ever arrive. */
export function isExistingAccount(user: Pick<User, 'identities'> | null | undefined): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}
