import { useState } from 'react';
import { ActivityIndicator, Alert, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { DateField } from './DateField';
import { FormRow } from './form/FormRow';
import { useReportFormState, type FormState } from './form/useFormState';
import { ListRow } from './list/ListRow';
import { ListSection } from './list/ListSection';
import { MoneyInput } from './MoneyInput';
import { persistPickedFile } from '../lib/fileStorage';
import { toStoredDate } from '../lib/format';
import { useSignedUrl } from '../lib/useSignedUrl';
import { newId } from '../lib/id';
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

  const [isUploading, setIsUploading] = useState(false);

  async function pickReceiptPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Allow photo access in the Settings app to attach a receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setIsUploading(true);
    try {
      const persistedUri = await persistPickedFile(result.assets[0].uri, 'receipts', `${newId()}.jpg`);
      setReceiptUri(persistedUri);
    } catch (err) {
      Alert.alert('Couldn’t Add Receipt', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <View className="mb-6">
        <SegmentedControl
          values={METHODS.map((m) => m.label)}
          selectedIndex={METHODS.findIndex((m) => m.value === method)}
          onChange={(e) => setMethod(METHODS[e.nativeEvent.selectedSegmentIndex].value)}
          accessibilityLabel="Payment method"
        />
      </View>

      <ListSection>
        <MoneyInput
          label="Amount"
          valueMinor={amountMinor}
          currencyCode={currencyCode}
          onChangeMinor={setAmountMinor}
          error={amountMinor > 0 ? null : 'Enter an amount greater than zero.'}
        />
        <DateField label="Date" value={settledDate} onChange={setSettledDate} />
      </ListSection>

      <ListSection footer="Optional, such as a check number or transaction ID.">
        <FormRow
          label="Reference"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="Optional"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={60}
        />
        <FormRow label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline maxLength={500} />
      </ListSection>

      <ListSection header="Receipt">
        {signedReceiptUrl ? (
          <Image
            source={{ uri: signedReceiptUrl }}
            className="w-full h-44"
            resizeMode="cover"
            accessibilityLabel="Receipt photo"
          />
        ) : null}
        <ListRow
          icon="photo"
          title={receiptUri ? 'Change Photo' : 'Attach Photo'}
          onPress={isUploading ? undefined : pickReceiptPhoto}
          trailing={isUploading ? <ActivityIndicator accessibilityLabel="Uploading Photo" /> : undefined}
          accessory="none"
        />
      </ListSection>
    </>
  );
}
