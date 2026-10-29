import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';
import { t } from '../../../src/lib/i18n';

/** Keeps the list under a document opened from another tab, so Back from it lands on Documents. */
export const unstable_settings = { initialRouteName: 'index' };

export default function DocumentsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t('Documents'), ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="[id]/index" options={{ title: t('Document') }} />
      <Stack.Screen name="[id]/edit" options={{ title: t('Edit Document') }} />
    </Stack>
  );
}
