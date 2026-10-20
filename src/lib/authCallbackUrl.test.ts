import { parseAuthCallbackUrl } from './authCallbackUrl';

describe('parseAuthCallbackUrl', () => {
  it('returns none for a missing or bare URL', () => {
    expect(parseAuthCallbackUrl(null)).toEqual({ kind: 'none' });
    expect(parseAuthCallbackUrl('quoteapp://auth/callback')).toEqual({
      kind: 'none',
    });
  });

  it('reads implicit-flow tokens from the fragment', () => {
    expect(
      parseAuthCallbackUrl(
        'quoteapp://auth/callback#access_token=at&expires_in=3600&refresh_token=rt&token_type=bearer&type=signup'
      )
    ).toEqual({
      kind: 'tokens',
      accessToken: 'at',
      refreshToken: 'rt',
      type: 'signup',
    });
  });

  it('reads a recovery link', () => {
    expect(
      parseAuthCallbackUrl('quoteapp://auth/callback#access_token=at&refresh_token=rt&type=recovery')
    ).toMatchObject({ kind: 'tokens', type: 'recovery' });
  });

  it('reads a PKCE code from the query', () => {
    expect(parseAuthCallbackUrl('quoteapp://auth/callback?code=abc')).toEqual({
      kind: 'code',
      code: 'abc',
      type: null,
    });
  });

  it('reads a token hash', () => {
    expect(parseAuthCallbackUrl('quoteapp://auth/callback?token_hash=h&type=signup')).toEqual({
      kind: 'tokenHash',
      tokenHash: 'h',
      type: 'signup',
    });
  });

  it('surfaces an error Supabase sent back', () => {
    expect(
      parseAuthCallbackUrl(
        'quoteapp://auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
      )
    ).toEqual({
      kind: 'error',
      message: 'Email link is invalid or has expired',
    });
  });
});
