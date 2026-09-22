import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="business-profile" options={{ title: 'Business Profile' }} />
      <Stack.Screen name="items/index" options={{ title: 'Item Catalog' }} />
      <Stack.Screen name="items/[id]/edit" options={{ title: 'Edit Item' }} />
      <Stack.Screen name="tax-brackets/index" options={{ title: 'Tax Rates' }} />
      <Stack.Screen name="tax-brackets/[id]/edit" options={{ title: 'Edit Tax Rate' }} />
      <Stack.Screen name="numbering" options={{ title: 'Invoice & Estimate Numbers' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="delete-data" options={{ title: 'Delete All Data' }} />
    </Stack>
  );
}
