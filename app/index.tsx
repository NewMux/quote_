import { Redirect } from 'expo-router';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';

export default function Index() {
  const profile = useBusinessProfileStore((s) => s.profile);
  const needsOnboarding = !profile?.business_name?.trim();
  return <Redirect href={needsOnboarding ? '/onboarding' : '/(tabs)/home'} />;
}
