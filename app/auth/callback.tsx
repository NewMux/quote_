import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/Button';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

/** Where every auth email link (signup confirmation, password recovery) redirects back into the
 * app. Exchanges the PKCE code Supabase appended to the link for a real session, then routes
 * onward explicitly (recovery -> set a new password; everything else -> onboarding/home) rather
 * than relying on app/index.tsx's one-shot redirect, for the same reason sign-in.tsx does its own
 * navigation: index.tsx only evaluates once and won't re-fire after this screen has moved on. */
export default function AuthCallbackScreen() {
  const { code, type } = useLocalSearchParams<{ code?: string; type?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!code) {
          setError('This link is missing required information. Request a new one and try again.');
          return;
        }

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          setError(exchangeError?.message ?? 'This link is invalid or has expired. Request a new one and try again.');
          return;
        }
        useAuthStore.setState({ session: data.session });

        if (type === 'recovery') {
          router.replace('/(auth)/reset-password');
          return;
        }

        await useBusinessProfileStore.getState().load();
        const profile = useBusinessProfileStore.getState().profile;
        router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    })();
  }, [code, type]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped px-6 gap-4">
        <Text className="text-title2 font-semibold text-label text-center" accessibilityRole="header">
          This Link Didn’t Work
        </Text>
        <Text className="text-body text-secondary text-center">{error}</Text>
        <Button label="Back to Sign In" variant="tinted" onPress={() => router.replace('/(auth)/sign-in')} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-grouped gap-3">
      <ActivityIndicator size="large" />
      <Text className="text-body text-secondary">Signing You In…</Text>
    </View>
  );
}
