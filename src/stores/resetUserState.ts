import * as Notifications from 'expo-notifications';
import type { StoreApi, UseBoundStore } from 'zustand';
import { clearSignedUrlCache } from '../lib/useSignedUrl';
import { useBusinessProfileStore } from './useBusinessProfileStore';
import { useClientsStore } from './useClientsStore';
import { useDocumentEditorStore } from './useDocumentEditorStore';
import { useDocumentsStore } from './useDocumentsStore';
import { useItemCatalogStore } from './useItemCatalogStore';
import { useReportsStore } from './useReportsStore';
import { useSubscriptionStore } from './useSubscriptionStore';
import { useTaxBracketsStore } from './useTaxBracketsStore';

function resetStore<T>(store: UseBoundStore<StoreApi<T>>): void {
  store.setState(store.getInitialState(), true);
}

/** Drops every cached list, filter, signed file URL, and scheduled overdue reminder for the
 * signed-in account — after Delete All Data, none of them point at anything real any more. */
export async function clearUserData(): Promise<void> {
  resetStore(useBusinessProfileStore);
  resetStore(useClientsStore);
  resetStore(useDocumentEditorStore);
  resetStore(useDocumentsStore);
  resetStore(useItemCatalogStore);
  resetStore(useReportsStore);
  resetStore(useTaxBracketsStore);
  clearSignedUrlCache();
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/** Clears everything the previous account left on the device, including the RevenueCat user, so
 * the next account to sign in here never sees (or gets notified about) the last one's data. Runs
 * on every SIGNED_OUT: sign-out, a revoked session, account deletion, and leaving password reset. */
export async function resetUserState(): Promise<void> {
  await clearUserData();
  await useSubscriptionStore.getState().reset();
}
