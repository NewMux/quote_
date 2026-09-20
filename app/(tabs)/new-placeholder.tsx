import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

/** This tab's press is intercepted (see (tabs)/_layout.tsx's tabPress listener) to push
 * /documents/new instead of switching to this tab. This screen is a defensive fallback in
 * case that listener doesn't fire (e.g. a deep link straight to this route). */
export default function NewPlaceholderScreen() {
  useEffect(() => {
    router.replace('/documents/new');
  }, []);

  return <View className="flex-1 bg-surface" />;
}
