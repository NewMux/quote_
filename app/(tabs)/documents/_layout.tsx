import { Stack } from 'expo-router';

export default function DocumentsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Documents', headerLargeTitleEnabled: true }} />
    </Stack>
  );
}
