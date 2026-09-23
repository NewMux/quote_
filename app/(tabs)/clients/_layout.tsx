import { Stack } from 'expo-router';
import { LARGE_TITLE_OPTIONS } from '../../../src/lib/navigationOptions';

export default function ClientsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Clients', ...LARGE_TITLE_OPTIONS }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Client' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Client' }} />
    </Stack>
  );
}
