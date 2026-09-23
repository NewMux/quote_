import { useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Button } from './Button';
import { DateField } from './DateField';
import { FormField } from './form/FormField';
import { useReportFormState, type FormState } from './form/useFormState';
import { MoneyInput } from './MoneyInput';
import { persistPickedFile } from '../lib/fileStorage';
import { toStoredDate } from '../lib/format';
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
  /** Receives the current value, validity, and dirtiness; the hosting sheet owns the Save action. */
  onStateChange: (state: FormState<SettlementFormValue>) => void;
}

/** Payment fields. Rendered inside a FormScrollView by the hosting sheet. */
export function SettlementForm({ defaultAmountMinor, currencyCode, initial, onStateChange }: SettlementFormProps) {
  const [method, setMethod] = useState<SettlementMethod>(initial?.method ?? 'cash');
  const [amountMinor, setAmountMinor] = useState(initial?.amount_minor ?? defaultAmountMinor);
  const [settledDate, setSettledDate] = useState(initial?.settled_date ?? toStoredDate(new Date()));
  const [referenceNumber, setReferenceNumber] = useState(initial?.reference_number ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [receiptUri, setReceiptUri] = useState<string | null>(initial?.receipt_photo_uri ?? null);
  const signedReceiptUrl = useSignedUrl(receiptUri);

  useReportFormState<SettlementFormValue>(
    {
      method,
      amountMinor,
      settledDate,
      referenceNumber: referenceNumber.trim() || null,
      receiptPhotoUri: receiptUri,
      notes: notes.trim() || null,
    },
    amountMinor > 0,
    onStateChange
  );

  async function pickReceiptPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Allow photo access in the Settings app to attach a receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const persistedUri = await persistPickedFile(result.assets[0].uri, 'receipts', `${newId()}.jpg`);
    setReceiptUri(persistedUri);
  }

  return (
    <>
      <View>
        <Text className="text-subhead text-secondary mb-1.5">Method</Text>
        <SegmentedControl
          values={METHODS.map((m) => m.label)}
          selectedIndex={METHODS.findIndex((m) => m.value === method)}
          tintColor={BRAND.default}
          activeFontStyle={{ color: '#FFFFFF' }}
          onChange={(e) => setMethod(METHODS[e.nativeEvent.selectedSegmentIndex].value)}
        />
      </View>

      <MoneyInput
        label="Amount"
        valueMinor={amountMinor}
        currencyCode={currencyCode}
        onChangeMinor={setAmountMinor}
        hint={amountMinor > 0 ? undefined : 'Enter an amount greater than zero.'}
      />

      <DateField label="Date" value={settledDate} onChange={setSettledDate} />

      <FormField
        label="Reference Number"
        hint="Optional, such as a check number or transaction ID."
        value={referenceNumber}
        onChangeText={setReferenceNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={60}
      />

      <FormField label="Notes" hint="Optional" value={notes} onChangeText={setNotes} multiline maxLength={500} />

      <View>
        <Text className="text-subhead text-secondary mb-1.5">Receipt Photo</Text>
        {signedReceiptUrl ? (
          <Image
            source={{ uri: signedReceiptUrl }}
            className="w-full h-40 rounded-xl mb-2"
            resizeMode="cover"
            accessibilityLabel="Receipt photo"
          />
        ) : null}
        <Button label={receiptUri ? 'Change Photo' : 'Attach Photo'} variant="tinted" onPress={pickReceiptPhoto} />
      </View>
    </>
  );
}
