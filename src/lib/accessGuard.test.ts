import { accessRedirect } from './accessGuard';

const base = { signedIn: true, subscriptionReady: true, isPro: true, firstSegment: 'documents' as string | undefined };

describe('accessRedirect', () => {
  it('lets a subscriber open anything', () => {
    for (const firstSegment of ['(tabs)', 'documents', 'clients', 'items', 'modals', 'settings', 'onboarding']) {
      expect(accessRedirect({ ...base, firstSegment })).toBeNull();
    }
  });

  it('sends an unsubscribed person from screens outside the tabs to the paywall', () => {
    for (const firstSegment of ['documents', 'clients', 'items', 'modals', 'settings']) {
      expect(accessRedirect({ ...base, isPro: false, firstSegment })).toBe('/paywall');
    }
  });

  it('leaves an unsubscribed person on setup, the paywall, the tabs and account screens', () => {
    for (const firstSegment of ['onboarding', 'paywall', 'delete-account', 'privacy-policy', '(tabs)', '(auth)', 'welcome', 'auth']) {
      expect(accessRedirect({ ...base, isPro: false, firstSegment })).toBeNull();
    }
  });

  it('does not redirect before the subscription status has loaded', () => {
    expect(accessRedirect({ ...base, isPro: false, subscriptionReady: false })).toBeNull();
  });

  it('sends a signed-out person to sign in, except on the public screens', () => {
    const out = { ...base, signedIn: false, isPro: false };
    for (const firstSegment of ['(tabs)', 'documents', 'onboarding', 'paywall', 'clients', 'modals']) {
      expect(accessRedirect({ ...out, firstSegment })).toBe('/(auth)/sign-in');
    }
    for (const firstSegment of ['(auth)', 'welcome', 'auth', 'privacy-policy']) {
      expect(accessRedirect({ ...out, firstSegment })).toBeNull();
    }
  });

  it('leaves the root route alone', () => {
    expect(accessRedirect({ ...base, signedIn: false, firstSegment: undefined })).toBeNull();
  });
});
