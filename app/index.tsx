import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useBusinessProfileStore((s) => s.profile);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const needsOnboarding = !profile?.business_name?.trim();
  return <Redirect href={needsOnboarding ? '/onboarding' : '/(tabs)/home'} />;
}
