import { Stack } from 'expo-router';

export default function ClientsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Clients', headerLargeTitleEnabled: true }} />
    </Stack>
  );
}
