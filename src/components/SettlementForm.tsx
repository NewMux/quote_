import { useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { DateField } from './DateField';
import { MoneyInput } from './MoneyInput';
import { persistPickedFile } from '../lib/fileStorage';
import { newId } from '../lib/id';
import type { SettlementMethod } from '../types/models';

const METHODS: Array<{ value: SettlementMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export interface SettlementFormValue {
  method: SettlementMethod;
  amountMinor: number;
  settledDate: string;
  referenceNumber: string | null;
  receiptPhotoUri: string | null;
  notes: string | null;
}

interface SettlementFormProps {
  defaultAmountMinor: number;
  onSubmit: (value: SettlementFormValue) => void;
  isSubmitting: boolean;
}

export function SettlementForm({ defaultAmountMinor, onSubmit, isSubmitting }: SettlementFormProps) {
  const [method, setMethod] = useState<SettlementMethod>('cash');
  const [amountMinor, setAmountMinor] = useState(defaultAmountMinor);
  const [settledDate, setSettledDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  async function pickReceiptPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to attach a receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const persistedUri = await persistPickedFile(result.assets[0].uri, 'receipts', `${newId()}.jpg`);
    setReceiptUri(persistedUri);
  }

  return (
    <View className="gap-4">
      <View>
        <Text className="text-xs text-gray-500 mb-2">Method</Text>
        <View className="flex-row flex-wrap gap-2">
          {METHODS.map((m) => {
            const selected = m.value === method;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMethod(m.value)}
                className={`px-3 py-2 rounded-full border ${selected ? 'bg-brand border-brand' : 'border-gray-300'}`}
              >
                <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <MoneyInput label="Amount" valueMinor={amountMinor} onChangeMinor={setAmountMinor} />

      <DateField label="Date" value={settledDate} onChange={setSettledDate} />

      <View>
        <Text className="text-xs text-gray-500 mb-1">Reference Number (optional)</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="Check #, transaction ID, etc."
        />
      </View>

      <View>
        <Text className="text-xs text-gray-500 mb-1">Notes (optional)</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <View>
        <Text className="text-xs text-gray-500 mb-2">Receipt Photo (optional)</Text>
        {receiptUri ? (
          <Image source={{ uri: receiptUri }} className="w-full h-40 rounded-lg mb-2" resizeMode="cover" />
        ) : null}
        <Pressable onPress={pickReceiptPhoto} className="border border-gray-300 rounded-lg px-3 py-2 self-start">
          <Text className="text-gray-700 text-sm">{receiptUri ? 'Change photo' : 'Attach photo'}</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={isSubmitting || amountMinor <= 0}
        onPress={() =>
          onSubmit({
            method,
            amountMinor,
            settledDate,
            referenceNumber: referenceNumber || null,
            receiptPhotoUri: receiptUri,
            notes: notes || null,
          })
        }
        className={`rounded-lg py-3 items-center ${amountMinor > 0 ? 'bg-brand' : 'bg-gray-300'}`}
      >
        <Text className="text-white font-semibold">{isSubmitting ? 'Saving…' : 'Log Payment'}</Text>
      </Pressable>
    </View>
  );
}
