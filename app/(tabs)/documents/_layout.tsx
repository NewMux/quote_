import { Stack } from 'expo-router';

export default function DocumentsStackLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Document' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Document' }} />
    </Stack>
  );
}
