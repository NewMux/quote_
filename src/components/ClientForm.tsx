import { useRef, useState, type ReactNode } from 'react';
import { Alert, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { FormField } from './form/FormField';
import { FormScrollView } from './form/FormScrollView';
import { useReportFormState, type FormState } from './form/useFormState';
import { persistPickedFile } from '../lib/fileStorage';
import { newId } from '../lib/id';
import type { ClientInput } from '../db/repositories/clients.repo';
import type { Client } from '../types/models';

interface ClientFormProps {
  initial?: Client;
  /** Receives the current input, validity, and dirtiness; the hosting screen owns the Save action. */
  onStateChange: (state: FormState<ClientInput>) => void;
  /** Extra rows rendered at the end of the form (e.g. destructive actions). */
  footer?: ReactNode;
}

export function ClientForm({ initial, onStateChange, footer }: ClientFormProps) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '');
  const [contactName, setContactName] = useState(initial?.contact_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [taxRegNumber, setTaxRegNumber] = useState(initial?.tax_registration_number ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);
  const contactRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  useReportFormState<ClientInput>(
    {
      display_name: displayName.trim(),
      contact_name: contactName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      tax_registration_number: taxRegNumber.trim() || null,
      notes: notes.trim() || null,
      photo_uri: photoUri,
    },
    !!displayName.trim(),
    onStateChange
  );

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Allow photo access in the Settings app to add a client photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const persistedUri = await persistPickedFile(result.assets[0].uri, 'client-photos', `${newId()}.jpg`);
    setPhotoUri(persistedUri);
  }

  return (
    <FormScrollView>
      <View className="items-center gap-1">
        <Avatar name={displayName || 'New Client'} photoUri={photoUri} size={80} />
        <Button label={photoUri ? 'Change Photo' : 'Add Photo'} variant="plain" onPress={pickPhoto} />
      </View>

      <FormField
        label="Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Business or person"
        maxLength={100}
        textContentType="organizationName"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => contactRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={contactRef}
        label="Contact Name"
        hint="Optional"
        value={contactName}
        onChangeText={setContactName}
        maxLength={100}
        textContentType="name"
        autoComplete="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={150}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={phoneRef}
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={30}
      />
      <FormField
        label="Address"
        value={address}
        onChangeText={setAddress}
        multiline
        textContentType="fullStreetAddress"
        autoComplete="street-address"
        maxLength={500}
      />
      <FormField
        label="Tax / VAT Registration Number"
        hint="Optional"
        value={taxRegNumber}
        onChangeText={setTaxRegNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={50}
      />
      <FormField label="Notes" hint="Only you see these." value={notes} onChangeText={setNotes} multiline maxLength={500} />
      {footer}
    </FormScrollView>
  );
}
