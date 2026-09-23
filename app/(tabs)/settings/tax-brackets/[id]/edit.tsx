import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FormRow } from '../../../../../src/components/form/FormRow';
import { FormScrollView } from '../../../../../src/components/form/FormScrollView';
import { ListRow } from '../../../../../src/components/list/ListRow';
import { ListSection } from '../../../../../src/components/list/ListSection';
import { parseRateBp } from '../../../../../src/lib/money';
import { useSaveHeader } from '../../../../../src/lib/useSaveHeader';
import { useUnsavedChangesGuard } from '../../../../../src/lib/useUnsavedChangesGuard';
import { useTaxBracketsStore } from '../../../../../src/stores/useTaxBracketsStore';
import type { TaxBracket } from '../../../../../src/types/models';

export default function EditTaxBracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { taxBrackets, update, archive, setDefault } = useTaxBracketsStore();
  const [bracket, setBracket] = useState<TaxBracket | null>(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const found = taxBrackets.find((b) => b.id === id) ?? null;
    setBracket(found);
    if (found) {
      setName(found.name);
      setRate(String(found.rate_bp / 100));
    }
  }, [id, taxBrackets]);

  const isDirty = !!bracket && (name.trim() !== bracket.name || parseRateBp(rate) !== bracket.rate_bp);
  const leave = useUnsavedChangesGuard(isDirty && !isSaving);

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await update(id, { name: name.trim(), rate_bp: parseRateBp(rate) });
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Tax Rate', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  useSaveHeader({ onSave: handleSave, disabled: !name.trim() || !isDirty || isSaving });

  function confirmArchive() {
    Alert.alert(`Archive ${bracket?.name ?? 'Tax Rate'}?`, "It won't be offered when you add new line items.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archive(id, true);
          leave(() => router.back());
        },
      },
    ]);
  }

  if (!bracket) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <FormScrollView>
      <ListSection>
        <FormRow label="Name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={50} />
        <FormRow label="Rate (%)" keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
      </ListSection>
      <ListSection footer="The default rate is applied to new taxable line items.">
        <ListRow
          title="Default Rate"
          switchValue={bracket.is_default === 1}
          switchDisabled={bracket.is_default === 1}
          onSwitchChange={(value) => {
            if (value) setDefault(id);
          }}
        />
      </ListSection>
      <ListSection>
        <ListRow title="Archive Tax Rate" onPress={confirmArchive} destructive centered />
      </ListSection>
    </FormScrollView>
  );
}
