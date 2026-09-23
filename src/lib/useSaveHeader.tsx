import { useLayoutEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { HeaderTextButton } from '../components/HeaderTextButton';
import { saveButtonItem } from './headerItems';

interface SaveHeaderOptions {
  title?: string;
  label?: string;
  onSave: () => void;
  disabled?: boolean;
}

/** Puts an edit screen's confirming action ("Save") in the trailing navigation bar slot — a native
 * bold bar button on iOS, a text button on Android. */
export function useSaveHeader({ title, label = 'Save', onSave, disabled = false }: SaveHeaderOptions) {
  const navigation = useNavigation();
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useLayoutEffect(() => {
    const save = () => onSaveRef.current();
    navigation.setOptions({
      ...(title ? { title } : {}),
      unstable_headerRightItems: () => [saveButtonItem(label, save, disabled)],
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => <HeaderTextButton label={label} onPress={save} disabled={disabled} prominent />,
    });
  }, [navigation, title, label, disabled]);
}
