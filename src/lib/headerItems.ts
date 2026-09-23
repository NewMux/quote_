import { Alert } from 'react-native';
import { router, type NativeStackHeaderItem } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { createDraftDocument } from '../db/repositories/documents.repo';
import { useBusinessProfileStore } from '../stores/useBusinessProfileStore';
import type { DocType } from '../types/models';
import { IS_IOS_26 } from './platform';

/** Native iOS navigation bar items (SF Symbols, UIMenu). Screens pass these through
 * `unstable_headerRightItems`, with a React `headerRight` as the Android fallback. */

let isCreatingDocument = false;

/** Creates a draft and opens it in the Documents tab (list → document → editor), from any tab. The
 * editor's Done then lands on the new document, ready to issue or share, and Back reaches the list. */
export async function startNewDocument(type: DocType) {
  const profile = useBusinessProfileStore.getState().profile;
  if (!profile || isCreatingDocument) return;
  isCreatingDocument = true;
  try {
    const doc = await createDraftDocument(type, profile, null, null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.navigate('/(tabs)/documents');
    router.push({ pathname: '/documents/[id]', params: { id: doc.id, isNew: '1' } });
  } catch (err) {
    Alert.alert('Couldn’t Create Document', err instanceof Error ? err.message : 'Something went wrong.');
  } finally {
    isCreatingDocument = false;
  }
}

/** Android fallback for the "+" menu: the same two choices as a system dialog. */
export function showNewDocumentChooser() {
  Alert.alert('New Document', undefined, [
    { text: 'New Invoice', onPress: () => startNewDocument('invoice') },
    { text: 'New Estimate', onPress: () => startNewDocument('estimate') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function newDocumentMenuItem(): NativeStackHeaderItem {
  return {
    type: 'menu',
    label: 'New Document',
    icon: { type: 'sfSymbol', name: 'plus' },
    menu: {
      items: [
        {
          type: 'action',
          label: 'New Invoice',
          icon: { type: 'sfSymbol', name: 'doc.text' },
          onPress: () => startNewDocument('invoice'),
        },
        {
          type: 'action',
          label: 'New Estimate',
          icon: { type: 'sfSymbol', name: 'doc.plaintext' },
          onPress: () => startNewDocument('estimate'),
        },
      ],
    },
  };
}

export function addButtonItem(label: string, onPress: () => void): NativeStackHeaderItem {
  return { type: 'button', label, icon: { type: 'sfSymbol', name: 'plus' }, onPress };
}

export function filterButtonItem(isActive: boolean, onPress: () => void): NativeStackHeaderItem {
  return {
    type: 'button',
    label: isActive ? 'Filters On' : 'Filter',
    icon: {
      type: 'sfSymbol',
      name: isActive ? 'line.3.horizontal.decrease.circle.fill' : 'line.3.horizontal.decrease.circle',
    },
    onPress,
  };
}

/** The trailing confirming action of an edit screen ("Save", "Done"). On iOS 26 it's a checkmark in
 * a prominent tinted glass circle, like Apple's own apps; earlier iOS shows the bold text label. */
export function saveButtonItem(label: string, onPress: () => void, disabled = false): NativeStackHeaderItem {
  if (IS_IOS_26) {
    return {
      type: 'button',
      label,
      icon: { type: 'sfSymbol', name: 'checkmark' },
      variant: 'prominent',
      accessibilityLabel: label,
      disabled,
      onPress,
    };
  }
  return { type: 'button', label, variant: 'done', disabled, onPress };
}
