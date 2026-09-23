import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';

/** Keeps the list under a document opened from another tab, so Back from it lands on Documents. */
export const unstable_settings = { initialRouteName: 'index' };

export default function DocumentsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Documents', ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Document' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Document' }} />
    </Stack>
  );
}
