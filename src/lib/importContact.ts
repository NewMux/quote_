import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts/legacy';
import { contactToClientInput } from './contactMapping';
import { persistPickedFile } from './fileStorage';
import { newId } from './id';
import type { ClientInput } from '../db/repositories/clients.repo';

export class ContactsAccessDeniedError extends Error {
  constructor() {
    super('Allow Contacts access for Invoice Them in the Settings app to add clients from your contacts.');
  }
}

/** Opens the system contact picker and returns the chosen contact as new-client fields (with its
 * photo uploaded, if it has one), or null if the person cancelled. On iOS the system picker needs
 * no permission; Android has to be allowed to read the chosen contact. */
export async function pickContactAsClient(): Promise<ClientInput | null> {
  if (Platform.OS === 'android') {
    const { granted } = await Contacts.requestPermissionsAsync();
    if (!granted) throw new ContactsAccessDeniedError();
  }
  const contact = await Contacts.presentContactPickerAsync();
  if (!contact) return null;
  const input = contactToClientInput(contact);
  if (!input) return null;

  const imageUri = contact.image?.uri;
  if (contact.imageAvailable && imageUri) {
    try {
      input.photo_uri = await persistPickedFile(imageUri, 'client-photos', `${newId()}.jpg`);
    } catch {
      // A contact photo is a nice extra; the client is still worth adding without it.
    }
  }
  return input;
}
