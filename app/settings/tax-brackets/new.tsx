import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { FormRow } from '../../../src/components/form/FormRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { SheetScreen } from '../../../src/components/SheetScreen';
import { parseRateBp } from '../../../src/lib/money';
import { useUnsavedChangesGuard } from '../../../src/lib/useUnsavedChangesGuard';
import { useTaxBracketsStore } from '../../../src/stores/useTaxBracketsStore';

export default function NewTaxBracketScreen() {
  const create = useTaxBracketsStore((s) => s.create);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const rateRef = useRef<TextInput>(null);
  const leave = useUnsavedChangesGuard(!!(name.trim() || rate.trim()) && !isSaving);
  const canAdd = !!name.trim() && !isSaving;

  async function handleAdd() {
    if (!canAdd) return;
    setIsSaving(true);
    try {
      await create({ name: name.trim(), rate_bp: parseRateBp(rate) });
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Add Tax Rate', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <SheetScreen
      header={<SheetHeader title="New Tax Rate" actionLabel="Add" onAction={handleAdd} actionDisabled={!canAdd} />}
    >
      <FormScrollView>
        <ListSection footer="Use the name your customers know, such as Sales Tax or VAT; it prints on documents.">
          <FormRow
            label="Name"
            placeholder="e.g. Sales Tax"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => rateRef.current?.focus()}
            submitBehavior="submit"
            maxLength={50}
          />
          <FormRow
            ref={rateRef}
            label="Rate (%)"
            placeholder="e.g. 8.25"
            keyboardType="decimal-pad"
            value={rate}
            onChangeText={setRate}
          />
        </ListSection>
      </FormScrollView>
    </SheetScreen>
  );
}
