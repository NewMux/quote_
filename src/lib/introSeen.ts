import * as SecureStore from 'expo-secure-store';

/** Whether this device has already shown the welcome tour, so a signed-out person who has seen it
 * (or who signed out) lands on Sign In instead of the tour every time. Per device, not per account. */
const KEY = 'invoicethem.introSeen';

export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY)) === '1';
  } catch {
    // Keychain unavailable (rare): showing the tour again is the harmless default.
    return false;
  }
}

export async function markIntroSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, '1');
  } catch {
    // Non-critical: worst case the tour shows once more.
  }
}
