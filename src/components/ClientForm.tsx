import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Field label="Name" value={displayName} onChangeText={setDisplayName} />
      <Field label="Contact Name (optional)" value={contactName} onChangeText={setContactName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Address" value={address} onChangeText={setAddress} multiline />
      <Field label="Tax / VAT Registration Number" value={taxRegNumber} onChangeText={setTaxRegNumber} />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

      <Pressable
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
          })
        }
        className={`rounded-lg py-3 items-center ${displayName.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <Text className="text-white font-semibold">{isSaving ? 'Saving…' : 'Save Client'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'email-address' | 'phone-pad';
}) {
  return (
    <View>
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}
