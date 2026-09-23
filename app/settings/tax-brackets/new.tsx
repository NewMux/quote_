import { useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FormField } from '../../../src/components/form/FormField';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { SheetHeader } from '../../../src/components/SheetHeader';
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
      Alert.alert('Could Not Add Tax Rate', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="New Tax Rate" actionLabel="Add" onAction={handleAdd} actionDisabled={!canAdd} />
      <FormScrollView>
        <FormField
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
        <FormField
          ref={rateRef}
          label="Rate (%)"
          placeholder="e.g. 8.25"
          keyboardType="decimal-pad"
          value={rate}
          onChangeText={setRate}
        />
      </FormScrollView>
    </View>
  );
}
