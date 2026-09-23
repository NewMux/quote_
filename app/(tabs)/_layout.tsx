import { ActivityIndicator, View, type ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/lib/theme';
import { useSubscriptionStore } from '../../src/stores/useSubscriptionStore';

type IconName = keyof typeof Ionicons.glyphMap;

/** Filled symbol for the selected tab, outline otherwise — the iOS tab bar convention. */
function tabIcon(filled: IconName, outline: IconName) {
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={size} color={color as string} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const isSubscriptionReady = useSubscriptionStore((s) => s.isReady);
  const isPro = useSubscriptionStore((s) => s.isPro);

  // Every route into the app (launch, sign-in, email links, onboarding) lands here, so this one
  // check gates the whole app behind the subscription.
  if (!isSubscriptionReady) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator size="large" accessibilityLabel="Loading" />
      </View>
    );
  }
  if (!isPro) {
    return <Redirect href="/paywall" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.tint }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen
        name="documents"
        options={{ title: 'Documents', tabBarIcon: tabIcon('document-text', 'document-text-outline') }}
      />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings', 'settings-outline') }}
      />
    </Tabs>
  );
}
