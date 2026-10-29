import '../global.css';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { THEME_COLORS, THEME_VARS } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useSubscriptionStore } from '../src/stores/useSubscriptionStore';
import { refreshAllReminders } from '../src/lib/notifications';
import { supabase } from '../src/lib/supabase';
import { Button } from '../src/components/Button';
import { resetUserState } from '../src/stores/resetUserState';
import { generateDueRecurringInvoices } from '../src/db/repositories/recurring.repo';
import { t } from '../src/lib/i18n';

// Keep the branded launch screen up until auth and the business profile have loaded, so launch
// goes straight from the logo to the first screen instead of flashing a spinner in between.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Never leave someone staring at the logo: if loading stalls, the spinner below takes over. */
const SPLASH_MAX_MS = 6000;

/** Follows the system Light/Dark appearance: feeds the semantic color variables to NativeWind and
 * gives the native headers, tab bar, and back buttons matching colors. */
function ThemeRoot({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = THEME_COLORS[scheme];
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.tint,
        background: colors.grouped,
        card: scheme === 'dark' ? colors.card : colors.background,
        text: colors.label,
        border: colors.separator,
        notification: colors.destructive,
      },
    };
  }, [scheme, colors]);

  return (
    <View style={[{ flex: 1, backgroundColor: colors.grouped }, THEME_VARS[scheme]]}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        {children}
      </ThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadProfile = useBusinessProfileStore((s) => s.load);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const configureSubscription = useSubscriptionStore((s) => s.configure);
  const session = useAuthStore((s) => s.session);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Every way of losing the session — sign-out, a revoked refresh token, account deletion —
  // arrives here, so per-user state is cleared in one place.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') resetUserState().catch(() => {});
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Keyed on the user id, not the session object: the session is replaced on every hourly token
  // refresh, which must not re-run launch work.
  const userId = session?.user.id ?? null;
  const [launchError, setLaunchError] = useState(false);
  const [launchAttempt, setLaunchAttempt] = useState(0);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!userId) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadProfile(), configureSubscription(userId)]);
      } catch {
        // Offline at launch, or a brief Supabase error — offer a retry instead of an endless
        // spinner.
        if (!cancelled) setLaunchError(true);
        return;
      }
      if (cancelled) return;
      setLaunchError(false);
      setReady(true);
      // A document's status can change from a different device while this one was closed, so
      // this resyncs every scheduled reminder against the current data on each sign-in/launch.
      // Non-critical — never blocks the app from becoming ready.
      refreshAllReminders().catch(() => {});
      // The server creates due recurring drafts daily; this just means they appear on launch
      // without waiting for that job. Also non-critical.
      generateDueRecurringInvoices().catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, userId, launchAttempt, loadProfile, configureSubscription]);

  const isLoading = !ready || isAuthLoading;
  // The launch screen also comes down for the "Couldn't Load Your Account" screen below. This hook
  // sits above that early return so every render calls the same hooks in the same order.
  const launchScreenDone = !isLoading || launchError;

  useEffect(() => {
    if (launchScreenDone) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), SPLASH_MAX_MS);
    return () => clearTimeout(timer);
  }, [launchScreenDone]);

  if (launchError && !ready) {
    return (
      <ThemeRoot>
        <View className="flex-1 items-center justify-center bg-grouped px-8 gap-4">
          <Text className="text-title3 font-semibold text-label text-center">{t('Couldn’t Load Your Account')}</Text>
          <Text className="text-body text-secondary text-center">
            {t('Check your internet connection, then try again.')}
          </Text>
          <Button
            label={t('Try Again')}
            onPress={() => {
              setLaunchError(false);
              setLaunchAttempt((n) => n + 1);
            }}
          />
          {/* A way out if the account itself is broken (e.g. its profile row is missing), not
              just the network. */}
          <Button label={t('Sign Out')} variant="plain" onPress={() => useAuthStore.getState().signOut()} />
        </View>
      </ThemeRoot>
    );
  }

  if (isLoading) {
    return (
      <ThemeRoot>
        <View className="flex-1 items-center justify-center bg-grouped">
          <ActivityIndicator size="large" accessibilityLabel={t('Loading')} />
        </View>
      </ThemeRoot>
    );
  }

  return (
    <ThemeRoot>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="privacy-policy" options={{ title: t('Privacy Policy'), presentation: 'modal' }} />
        <Stack.Screen name="delete-account" options={{ title: t('Delete Account') }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="documents/new" options={{ title: t('New Document') }} />
        <Stack.Screen
          name="documents/[id]/settlement-new"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="clients/new"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.75, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="items/new"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="settings/tax-brackets/new"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/sign"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modals/client-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/document-filter"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.75, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/client-filter"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/item-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/custom-range"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/recurring"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.7, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/currency-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
    </ThemeRoot>
  );
}
