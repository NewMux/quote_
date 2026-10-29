import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';
import { t } from '../../../src/lib/i18n';

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('Summary'), ...LARGE_TITLE_OPTIONS }} />
    </Stack>
  );
}
