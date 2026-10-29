import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';
import { t } from '../../../src/lib/i18n';

export default function ClientsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t('Clients'), ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="[id]/index" options={{ title: t('Client') }} />
      <Stack.Screen name="[id]/edit" options={{ title: t('Edit Client') }} />
    </Stack>
  );
}
