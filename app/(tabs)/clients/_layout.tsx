import { Stack } from 'expo-router';

export default function ClientsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Client' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Client' }} />
    </Stack>
  );
}
