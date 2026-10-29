import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';
import { t } from '../../../src/lib/i18n';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t('Settings'), ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="business-profile" options={{ title: t('Business Profile') }} />
      <Stack.Screen name="items/index" options={{ title: t('Item Catalog') }} />
      <Stack.Screen name="items/[id]/edit" options={{ title: t('Edit Item') }} />
      <Stack.Screen name="tax-brackets/index" options={{ title: t('Tax Rates') }} />
      <Stack.Screen name="tax-brackets/[id]/edit" options={{ title: t('Edit Tax Rate') }} />
      <Stack.Screen name="numbering" options={{ title: t('Invoice & Estimate Numbers') }} />
      <Stack.Screen name="recurring" options={{ title: t('Recurring Invoices') }} />
      <Stack.Screen name="subscription" options={{ title: t('Subscription') }} />
      <Stack.Screen name="privacy-policy" options={{ title: t('Privacy Policy') }} />
      <Stack.Screen name="delete-data" options={{ title: t('Delete All Data') }} />
      <Stack.Screen name="delete-account" options={{ title: t('Delete Account') }} />
    </Stack>
  );
}
