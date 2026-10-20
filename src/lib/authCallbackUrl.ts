/** Where every auth email (signup confirmation, password recovery) sends the user back to. Must
 * match an entry in Supabase → Authentication → URL Configuration → Redirect URLs exactly;
 * Supabase silently swaps in the Site URL for anything that doesn't match. Written out rather
 * than built with `Linking.createURL('/auth/callback')`, which in a release build yields
 * `quoteapp:///auth/callback` (three slashes) and so never matches. */
export const AUTH_CALLBACK_URL = 'quoteapp://auth/callback';

/** What an auth email link (signup confirmation, password recovery) carried back into the app.
 * Supabase can return any of three shapes depending on the client's flow type and the email
 * template, so the callback screen accepts all of them:
 * - PKCE: `?code=...`
 * - implicit (supabase-js's default): `#access_token=...&refresh_token=...&type=signup`
 * - token-hash email templates: `?token_hash=...&type=signup`
 * A failed verification comes back as `?error_description=...` or `#error_description=...`. */
export type AuthCallbackPayload =
  | { kind: 'code'; code: string; type: string | null }
  | {
      kind: 'tokens';
      accessToken: string;
      refreshToken: string;
      type: string | null;
    }
  | { kind: 'tokenHash'; tokenHash: string; type: string | null }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

function parseParams(part: string): URLSearchParams {
  return new URLSearchParams(part.startsWith('?') || part.startsWith('#') ? part.slice(1) : part);
}

export function parseAuthCallbackUrl(url: string | null | undefined): AuthCallbackPayload {
  if (!url) return { kind: 'none' };

  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const query = parseParams(queryIndex === -1 ? '' : beforeHash.slice(queryIndex));
  const fragment = parseParams(hashIndex === -1 ? '' : url.slice(hashIndex));
  const get = (key: string) => fragment.get(key) ?? query.get(key);
  const type = get('type');

  const errorMessage = get('error_description') ?? get('error');
  if (errorMessage) return { kind: 'error', message: errorMessage.replace(/\+/g, ' ') };

  const accessToken = get('access_token');
  const refreshToken = get('refresh_token');
  if (accessToken && refreshToken) return { kind: 'tokens', accessToken, refreshToken, type };

  const code = get('code');
  if (code) return { kind: 'code', code, type };

  const tokenHash = get('token_hash');
  if (tokenHash) return { kind: 'tokenHash', tokenHash, type };

  return { kind: 'none' };
}
