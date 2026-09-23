import '../global.css';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { THEME_COLORS, THEME_VARS } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useSubscriptionStore } from '../src/stores/useSubscriptionStore';
import { refreshAllReminders } from '../src/lib/notifications';
import { generateDueRecurringInvoices } from '../src/db/repositories/recurring.repo';

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

  useEffect(() => {
    if (isAuthLoading) return;
    if (!session) {
      setReady(true);
      return;
    }
    (async () => {
      await Promise.all([loadProfile(), configureSubscription(session.user.id)]);
      setReady(true);
      // A document's status can change from a different device while this one was closed, so
      // this resyncs every scheduled reminder against the current data on each sign-in/launch.
      // Non-critical — never blocks the app from becoming ready.
      refreshAllReminders().catch(() => {});
      // The server creates due recurring drafts daily; this just means they appear on launch
      // without waiting for that job. Also non-critical.
      generateDueRecurringInvoices().catch(() => {});
    })();
  }, [isAuthLoading, session, loadProfile, configureSubscription]);

  if (!ready || isAuthLoading) {
    return (
      <ThemeRoot>
        <View className="flex-1 items-center justify-center bg-grouped">
          <ActivityIndicator size="large" accessibilityLabel="Loading" />
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
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy', presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="documents/new" options={{ title: 'New Document' }} />
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
