import { useState } from 'react';
import { Alert, Image, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Button } from './Button';
import { DateField } from './DateField';
import { MoneyInput } from './MoneyInput';
import { persistPickedFile } from '../lib/fileStorage';
import { useSignedUrl } from '../lib/useSignedUrl';
import { newId } from '../lib/id';
import { BRAND } from '../lib/theme';
import type { Settlement, SettlementMethod } from '../types/models';

const METHODS: { value: SettlementMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank' },
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
  currencyCode: string;
  initial?: Settlement;
  onSubmit: (value: SettlementFormValue) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export function SettlementForm({
  defaultAmountMinor,
  currencyCode,
  initial,
  onSubmit,
  onDelete,
  isSubmitting,
}: SettlementFormProps) {
  const [method, setMethod] = useState<SettlementMethod>(initial?.method ?? 'cash');
  const [amountMinor, setAmountMinor] = useState(initial?.amount_minor ?? defaultAmountMinor);
  const [settledDate, setSettledDate] = useState(initial?.settled_date ?? new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState(initial?.reference_number ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [receiptUri, setReceiptUri] = useState<string | null>(initial?.receipt_photo_uri ?? null);
  const signedReceiptUrl = useSignedUrl(receiptUri);

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
        <Text className="text-xs text-secondary mb-2">Method</Text>
        <SegmentedControl
          values={METHODS.map((m) => m.label)}
          selectedIndex={METHODS.findIndex((m) => m.value === method)}
          tintColor={BRAND.default}
          activeFontStyle={{ color: '#FFFFFF' }}
          onChange={(e) => setMethod(METHODS[e.nativeEvent.selectedSegmentIndex].value)}
        />
      </View>

      <MoneyInput label="Amount" valueMinor={amountMinor} currencyCode={currencyCode} onChangeMinor={setAmountMinor} />

      <DateField label="Date" value={settledDate} onChange={setSettledDate} />

      <View>
        <Text className="text-xs text-secondary mb-1">Reference Number (optional)</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="Check #, transaction ID, etc."
        />
      </View>

      <View>
        <Text className="text-xs text-secondary mb-1">Notes (optional)</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <View>
        <Text className="text-xs text-secondary mb-2">Receipt Photo (optional)</Text>
        {signedReceiptUrl ? (
          <Image source={{ uri: signedReceiptUrl }} className="w-full h-40 rounded-lg mb-2" resizeMode="cover" />
        ) : null}
        <Button label={receiptUri ? 'Change photo' : 'Attach photo'} variant="tinted" onPress={pickReceiptPhoto} />
      </View>

      <Button
        label={isSubmitting ? 'Saving…' : initial ? 'Save Changes' : 'Log Payment'}
        variant="filled"
        size="large"
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
      />

      {onDelete ? <Button label="Delete Payment" variant="destructive" size="large" onPress={onDelete} /> : null}
    </View>
  );
}
