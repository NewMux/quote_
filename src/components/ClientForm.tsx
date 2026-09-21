import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { persistPickedFile } from '../lib/fileStorage';
import { newId } from '../lib/id';
import type { ClientInput } from '../db/repositories/clients.repo';
import type { Client } from '../types/models';

interface ClientFormProps {
  initial?: Client;
  onSubmit: (input: ClientInput) => void;
  isSaving: boolean;
}

export function ClientForm({ initial, onSubmit, isSaving }: ClientFormProps) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '');
  const [contactName, setContactName] = useState(initial?.contact_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [taxRegNumber, setTaxRegNumber] = useState(initial?.tax_registration_number ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to set a client photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const persistedUri = await persistPickedFile(result.assets[0].uri, 'client-photos', `${newId()}.jpg`);
    setPhotoUri(persistedUri);
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="items-center gap-2">
        <Avatar name={displayName || 'New Client'} photoUri={photoUri} size={72} />
        <Button label={photoUri ? 'Change photo' : 'Add photo'} variant="plain" onPress={pickPhoto} />
      </View>

      <Field label="Name" value={displayName} onChangeText={setDisplayName} maxLength={100} />
      <Field label="Contact Name (optional)" value={contactName} onChangeText={setContactName} maxLength={100} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" maxLength={150} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} />
      <Field label="Address" value={address} onChangeText={setAddress} multiline maxLength={500} />
      <Field
        label="Tax / VAT Registration Number"
        value={taxRegNumber}
        onChangeText={setTaxRegNumber}
        maxLength={50}
      />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline maxLength={500} />

      <Button
        label={isSaving ? 'Saving…' : 'Save Client'}
        variant="filled"
        size="large"
        disabled={isSaving || !displayName.trim()}
        onPress={() =>
          onSubmit({
            display_name: displayName.trim(),
            contact_name: contactName || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            tax_registration_number: taxRegNumber || null,
            notes: notes || null,
            photo_uri: photoUri,
          })
        }
      />
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'email-address' | 'phone-pad';
  maxLength?: number;
}) {
  return (
    <View>
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-2xl px-3 py-2 bg-white text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}
