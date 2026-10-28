import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { hasSeenIntro } from '../src/lib/introSeen';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useBusinessProfileStore((s) => s.profile);
  // Only matters when signed out: first launch shows the welcome tour, later launches go to Sign In.
  const [introSeen, setIntroSeen] = useState<boolean | null>(session ? true : null);

  useEffect(() => {
    if (session) return;
    let cancelled = false;
    hasSeenIntro().then((seen) => {
      if (!cancelled) setIntroSeen(seen);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session) {
    // The root layout's splash is already gone; this lookup is a single keychain read.
    if (introSeen === null) return null;
    return <Redirect href={introSeen ? '/(auth)/sign-in' : '/welcome'} />;
  }

  const needsOnboarding = !profile?.business_name?.trim();
  return <Redirect href={needsOnboarding ? '/onboarding' : '/(tabs)/home'} />;
}
