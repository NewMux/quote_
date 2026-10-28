import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { Button } from '../../src/components/Button';
import { parseAuthCallbackUrl } from '../../src/lib/authCallbackUrl';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

const EXPIRED_MESSAGE =
  'This link was already used or has expired. If you already confirmed your email, just sign in. Otherwise request a new link and try again.';
const CONFIRMED_SIGN_IN_MESSAGE = 'Your email is confirmed. Sign in with your email and password to continue.';

/** Where every auth email link (signup confirmation, password recovery) redirects back into the
 * app. Turns whatever Supabase appended to the link (implicit-flow tokens in the fragment, a PKCE
 * code, or a token hash) into a real session, then routes
 * onward explicitly (recovery -> set a new password; everything else -> onboarding/home) rather
 * than relying on app/index.tsx's one-shot redirect, for the same reason sign-in.tsx does its own
 * navigation: index.tsx only evaluates once and won't re-fire after this screen has moved on. */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const linkingUrl = Linking.useLinkingURL();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  // expo-router hands query params over as-is and the URL fragment as params['#']; rebuild a URL
  // from them, falling back to the raw linking URL in case the router dropped anything.
  const { '#': hash, ...query } = params;
  const routerUrl = `quoteapp://auth/callback?${new URLSearchParams(query).toString()}${hash ? `#${hash}` : ''}`;
  let payload = parseAuthCallbackUrl(routerUrl);
  if (payload.kind === 'none' && linkingUrl?.includes('auth/callback')) payload = parseAuthCallbackUrl(linkingUrl);

  useEffect(() => {
    if (handled.current || payload.kind === 'none') return;
    handled.current = true;
    (async () => {
      try {
        if (payload.kind === 'error') {
          setError(/expired|invalid|already/i.test(payload.message) ? EXPIRED_MESSAGE : payload.message);
          return;
        }

        let session: Session | null = null;
        let type = payload.type;
        if (payload.kind === 'tokens') {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: payload.accessToken,
            refresh_token: payload.refreshToken,
          });
          if (sessionError) throw sessionError;
          session = data.session;
        } else if (payload.kind === 'code') {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(payload.code);
          if (exchangeError) throw exchangeError;
          session = data.session;
        } else {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: payload.tokenHash,
            type: (type ?? 'signup') as EmailOtpType,
          });
          if (verifyError) throw verifyError;
          session = data.session;
          type = type ?? 'signup';
        }

        if (!session) {
          setError(type === 'recovery' ? EXPIRED_MESSAGE : CONFIRMED_SIGN_IN_MESSAGE);
          return;
        }
        useAuthStore.setState({ session });

        if (type === 'recovery') {
          router.replace('/(auth)/reset-password');
          return;
        }

        await useBusinessProfileStore.getState().load();
        const profile = useBusinessProfileStore.getState().profile;
        router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
      } catch (err) {
        // A signup link that reached Supabase has already confirmed the email, even when this
        // device can't finish signing in (e.g. the PKCE verifier lives on another device).
        const isSignup = payload.kind !== 'error' && payload.type !== 'recovery';
        setError(
          isSignup
            ? CONFIRMED_SIGN_IN_MESSAGE
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.'
        );
      }
    })();
  }, [payload]);

  // Give the router and linking URL a moment to arrive before calling the link incomplete.
  useEffect(() => {
    if (payload.kind !== 'none') return;
    const timer = setTimeout(() => {
      if (!handled.current) setError('This link is missing required information. Request a new one and try again.');
    }, 3000);
    return () => clearTimeout(timer);
  }, [payload.kind]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped px-6 gap-4">
        <Text className="text-title2 font-semibold text-label text-center" accessibilityRole="header">
          {error === CONFIRMED_SIGN_IN_MESSAGE ? 'Email Confirmed' : 'This Link Didn’t Work'}
        </Text>
        <Text className="text-body text-secondary text-center">{error}</Text>
        <Button
          label={error === CONFIRMED_SIGN_IN_MESSAGE ? 'Sign In' : 'Back to Sign In'}
          variant="tinted"
          onPress={() => router.replace('/(auth)/sign-in')}
        />
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
