import { isExistingAccount } from './signUpResult';

describe('isExistingAccount', () => {
  it('is true when Supabase returns a user with no identities (the address is already registered)', () => {
    expect(isExistingAccount({ identities: [] })).toBe(true);
  });

  it('is false for a new sign-up, which comes back with its email identity', () => {
    expect(isExistingAccount({ identities: [{ id: '1' } as never] })).toBe(false);
  });

  it('is false when there is no user or no identities field to judge by', () => {
    expect(isExistingAccount(null)).toBe(false);
    expect(isExistingAccount(undefined)).toBe(false);
    expect(isExistingAccount({ identities: undefined })).toBe(false);
  });
});
