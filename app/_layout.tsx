import '../global.css';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { db } from '../src/db/client';
import { migrate } from '../src/db/migrate';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadProfile = useBusinessProfileStore((s) => s.load);

  useEffect(() => {
    (async () => {
      await migrate(db);
      await loadProfile();
      setReady(true);
    })();
  }, [loadProfile]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="documents/new" options={{ title: 'New Document' }} />
        <Stack.Screen name="documents/[id]/index" options={{ title: 'Document' }} />
        <Stack.Screen name="documents/[id]/edit" options={{ title: 'Edit Document' }} />
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
        <Stack.Screen name="clients/[id]/index" options={{ title: 'Client' }} />
        <Stack.Screen name="clients/[id]/edit" options={{ title: 'Edit Client' }} />
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
        <Stack.Screen name="items/[id]/edit" options={{ title: 'Edit Item' }} />
        <Stack.Screen name="settings/business-profile" options={{ title: 'Business Profile' }} />
        <Stack.Screen name="settings/items" options={{ title: 'Item Catalog' }} />
        <Stack.Screen name="settings/tax-brackets" options={{ title: 'Tax Rates' }} />
        <Stack.Screen name="settings/numbering" options={{ title: 'Invoice & Estimate Numbers' }} />
        <Stack.Screen
          name="modals/sign"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/client-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="modals/item-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
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
          name="modals/currency-picker"
          options={{
            headerShown: false,
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1.0],
            sheetGrabberVisible: true,
            sheetCornerRadius: 20,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
