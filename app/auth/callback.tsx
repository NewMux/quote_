import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
    })();
  }, [code, type]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-base text-gray-700 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <ActivityIndicator size="large" />
    </View>
  );
}
