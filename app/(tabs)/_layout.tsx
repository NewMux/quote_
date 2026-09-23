import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FabSpeedDial, type FabAction } from '../../src/components/FabSpeedDial';
import { BRAND } from '../../src/lib/theme';
import { useSubscriptionStore } from '../../src/stores/useSubscriptionStore';

interface RaisedCenterButtonProps {
  onPress?: (e: GestureResponderEvent) => void;
  isOpen: boolean;
}

function RaisedCenterButton({ onPress, isOpen }: RaisedCenterButtonProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, { toValue: isOpen ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [isOpen, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <Pressable onPress={onPress} style={{ top: -22, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={[BRAND.default, BRAND.darker]}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={28} color="white" />
        </Animated.View>
      </LinearGradient>
      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>New</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const isSubscriptionReady = useSubscriptionStore((s) => s.isReady);
  const isPro = useSubscriptionStore((s) => s.isPro);

  const fabActions: FabAction[] = [
    {
      label: 'New Invoice',
      icon: 'document-text-outline',
      onPress: () => router.push({ pathname: '/documents/new', params: { type: 'invoice' } }),
    },
    {
      label: 'New Estimate',
      icon: 'receipt-outline',
      onPress: () => router.push({ pathname: '/documents/new', params: { type: 'estimate' } }),
    },
    { label: 'New Client', icon: 'person-add-outline', onPress: () => router.push('/clients/new') },
    { label: 'New Item', icon: 'pricetag-outline', onPress: () => router.push('/items/new') },
    {
      label: 'New Tax Rate',
      icon: 'calculator-outline',
      onPress: () => router.push('/settings/tax-brackets/new'),
    },
  ];

  // Every route into the app (launch, sign-in, email links, onboarding) lands here, so this one
  // check gates the whole app behind the subscription.
  if (!isSubscriptionReady) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!isPro) {
    return <Redirect href="/paywall" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: BRAND.default }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
          listeners={{ tabPress: () => setIsFabOpen(false) }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documents',
            tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
          }}
          listeners={{ tabPress: () => setIsFabOpen(false) }}
        />
        <Tabs.Screen
          name="new-placeholder"
          options={{
            title: '',
            tabBarButton: (props) => <RaisedCenterButton onPress={props.onPress} isOpen={isFabOpen} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsFabOpen((open) => !open);
            },
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clients',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
          listeners={{ tabPress: () => setIsFabOpen(false) }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          }}
          listeners={{ tabPress: () => setIsFabOpen(false) }}
        />
      </Tabs>
      {isFabOpen ? <FabSpeedDial actions={fabActions} onClose={() => setIsFabOpen(false)} /> : null}
    </View>
  );
}
