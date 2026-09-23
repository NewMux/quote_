import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/lib/theme';
import { useSubscriptionStore } from '../../src/stores/useSubscriptionStore';

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

  // The system tab bar: Liquid Glass on iOS 26 (shrinking as content scrolls), the standard
  // translucent bar on earlier iOS, and a Material navigation bar on Android. SF Symbols on iOS,
  // filled when selected; Ionicons stand in on Android.
  return (
    <NativeTabs tintColor={colors.tint} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />}
        />
        <NativeTabs.Trigger.Label>Summary</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="document-text" />}
        />
        <NativeTabs.Trigger.Label>Documents</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clients">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="people" />}
        />
        <NativeTabs.Trigger.Label>Clients</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />}
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
