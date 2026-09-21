import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { parseRateBp } from '../../../src/lib/money';
import { useTaxBracketsStore } from '../../../src/stores/useTaxBracketsStore';

export default function NewTaxBracketScreen() {
  const create = useTaxBracketsStore((s) => s.create);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSaving(true);
    await create({ name: name.trim(), rate_bp: parseRateBp(rate) });
    setIsSaving(false);
    router.back();
  }

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title="New Tax Rate" />
      <View className="p-4 gap-4">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            placeholder="e.g. Sales Tax"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Rate %</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            placeholder="e.g. 8.25"
            keyboardType="decimal-pad"
            value={rate}
            onChangeText={setRate}
          />
        </View>
        <Button
          label={isSaving ? 'Saving…' : 'Save'}
          variant="filled"
          size="large"
          disabled={isSaving || !name.trim()}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}
