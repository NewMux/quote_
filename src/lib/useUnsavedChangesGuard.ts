import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
// Not re-exported from expo-router's entry point; this is the same navigation core the router
// uses, so it also blocks the native swipe-back and sheet swipe-down gestures.
import { usePreventRemove } from 'expo-router/build/react-navigation/core';

function confirmDiscard(onDiscard: () => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "You haven't saved your changes.",
        options: ['Discard Changes', 'Keep Editing'],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (index) => {
        if (index === 0) onDiscard();
      }
    );
    return;
  }
  Alert.alert('Discard Changes?', "You haven't saved your changes.", [
    { text: 'Keep Editing', style: 'cancel' },
    { text: 'Discard Changes', style: 'destructive', onPress: onDiscard },
  ]);
}

/** Asks before Back, swipe-back, Cancel, or a sheet swipe-down throws away unsaved edits.
 * Returns `leave(navigate)`: call it after a successful save to navigate without the prompt. */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const navigation = useNavigation();
  const [isLeaving, setIsLeaving] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);

  usePreventRemove(isDirty && !isLeaving, ({ data }) => {
    confirmDiscard(() => navigation.dispatch(data.action));
  });

  useEffect(() => {
    if (!isLeaving || !pendingNavigation.current) return;
    const navigate = pendingNavigation.current;
    pendingNavigation.current = null;
    navigate();
  }, [isLeaving]);

  return useCallback((navigate: () => void) => {
    pendingNavigation.current = navigate;
    setIsLeaving(true);
  }, []);
}
