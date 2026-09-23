import { Alert } from 'react-native';
import { router, type NativeStackHeaderItem } from 'expo-router';
import type { DocType } from '../types/models';

/** Native iOS navigation bar items (SF Symbols, UIMenu). Screens pass these through
 * `unstable_headerRightItems`, with a React `headerRight` as the Android fallback. */

export function startNewDocument(type: DocType) {
  router.push({ pathname: '/documents/new', params: { type } });
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

/** The trailing confirming action of an edit screen ("Save", "Done"), in the bold "done" style. */
export function saveButtonItem(label: string, onPress: () => void, disabled = false): NativeStackHeaderItem {
  return { type: 'button', label, variant: 'done', disabled, onPress };
}
