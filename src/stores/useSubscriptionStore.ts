import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { hasProEntitlement } from '../lib/subscription';

/** RevenueCat's public SDK key — safe to ship in the client, like the Supabase anon key. */
const API_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

interface SubscriptionState {
  /** False until the first entitlement check for the signed-in user has finished. */
  isReady: boolean;
  isPro: boolean;
  /** False when no RevenueCat key is set — only allowed in development, where the gate is open. */
  isAvailable: boolean;
  customerInfo: CustomerInfo | null;
  offering: PurchasesOffering | null;
  configure: (userId: string) => Promise<void>;
  loadOffering: () => Promise<void>;
  /** Resolves false (without throwing) when the person cancels the App Store sheet. */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  reset: () => Promise<void>;
}

let sdkConfigured = false;
let currentUserId: string | null = null;

function isCancelled(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  function applyCustomerInfo(info: CustomerInfo) {
    set({ customerInfo: info, isPro: hasProEntitlement(info) });
  }

  return {
    isReady: false,
    isPro: false,
    isAvailable: Boolean(API_KEY),
    customerInfo: null,
    offering: null,

    configure: async (userId) => {
      // A token refresh re-fires the session effect for the same user — don't re-gate the app.
      if (currentUserId === userId && get().isReady) return;
      currentUserId = userId;

      if (!API_KEY) {
        // No key means purchases can't work in this build. Development (Expo Go) stays usable;
        // a release build without a key fails closed and shows the paywall.
        set({ isReady: true, isPro: __DEV__, isAvailable: false });
        return;
      }

      set({ isReady: false });
      try {
        if (!sdkConfigured) {
          Purchases.configure({ apiKey: API_KEY, appUserID: userId });
          // Renewals, expiries, refunds, and purchases on another device arrive here.
          Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
          sdkConfigured = true;
        } else {
          const { customerInfo } = await Purchases.logIn(userId);
          applyCustomerInfo(customerInfo);
        }
        // Served from the SDK's cache when fresh, so paying users don't wait on the network.
        applyCustomerInfo(await Purchases.getCustomerInfo());
      } catch {
        set({ isPro: false });
      } finally {
        set({ isReady: true });
      }
    },

    loadOffering: async () => {
      if (!sdkConfigured) return;
      const offerings = await Purchases.getOfferings();
      set({ offering: offerings.current });
    },

    purchase: async (pkg) => {
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        applyCustomerInfo(customerInfo);
        return hasProEntitlement(customerInfo);
      } catch (err) {
        if (isCancelled(err)) return false;
        throw err;
      }
    },

    restore: async () => {
      const info = await Purchases.restorePurchases();
      applyCustomerInfo(info);
      return hasProEntitlement(info);
    },

    reset: async () => {
      currentUserId = null;
      set({ isReady: false, isPro: false, customerInfo: null, offering: null });
      if (!sdkConfigured) return;
      try {
        await Purchases.logOut();
      } catch {
        // Throws if the SDK's current user is already anonymous — nothing left to clear.
      }
    },
  };
});
