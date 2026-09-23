import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Settings', ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="business-profile" options={{ title: 'Business Profile' }} />
      <Stack.Screen name="items/index" options={{ title: 'Item Catalog' }} />
      <Stack.Screen name="items/[id]/edit" options={{ title: 'Edit Item' }} />
      <Stack.Screen name="tax-brackets/index" options={{ title: 'Tax Rates' }} />
      <Stack.Screen name="tax-brackets/[id]/edit" options={{ title: 'Edit Tax Rate' }} />
      <Stack.Screen name="numbering" options={{ title: 'Invoice & Estimate Numbers' }} />
      <Stack.Screen name="recurring" options={{ title: 'Recurring Invoices' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="delete-data" options={{ title: 'Delete All Data' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete Account' }} />
    </Stack>
  );
}
