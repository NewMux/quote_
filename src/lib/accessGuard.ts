/** Where the app must send someone who has opened a route they aren't allowed on, or null when they
 * can stay. The tabs already send an unsubscribed person to the paywall, but the other screens
 * (new document, new client, a document by link…) sit outside the tabs, so an app link such as
 * quoteapp://documents/new could open them without a subscription, or without signing in. This one
 * rule covers every route. It's a courtesy check on the device: what a person can read or change
 * is enforced by the database's row-level security, not by this. */

export interface AccessState {
  signedIn: boolean;
  /** False until the subscription status has loaded: don't redirect on a guess. */
  subscriptionReady: boolean;
  isPro: boolean;
  /** The first path segment of the open route, e.g. "documents" or "(tabs)"; undefined at "/". */
  firstSegment: string | undefined;
}

/** Open to everyone, signed in or not. */
const PUBLIC = new Set(['(auth)', 'welcome', 'auth', 'privacy-policy']);
/** Open once signed in, subscribed or not: setup, the paywall, and leaving. The tabs gate
 * themselves and send anyone unsubscribed to the paywall. */
const SIGNED_IN = new Set([...PUBLIC, 'onboarding', 'paywall', 'delete-account', '(tabs)']);

export function accessRedirect({ signedIn, subscriptionReady, isPro, firstSegment }: AccessState): '/paywall' | '/(auth)/sign-in' | null {
  if (firstSegment === undefined) return null; // "/" picks the right place itself
  if (!signedIn) return PUBLIC.has(firstSegment) ? null : '/(auth)/sign-in';
  if (!subscriptionReady || isPro) return null;
  return SIGNED_IN.has(firstSegment) ? null : '/paywall';
}
