import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Button } from '../../../../../src/components/Button';
import { formatRateBp, parseRateBp } from '../../../../../src/lib/money';
import { useTaxBracketsStore } from '../../../../../src/stores/useTaxBracketsStore';
import type { TaxBracket } from '../../../../../src/types/models';

export default function EditTaxBracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { taxBrackets, update, archive } = useTaxBracketsStore();
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

  useEffect(() => {
    navigation.setOptions({
      title: bracket ? `Edit ${bracket.name}` : 'Edit Tax Rate',
      headerRight: () => (
        <Pressable onPress={confirmArchive}>
          <Text className="text-destructive">Archive</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, id, bracket]);

  function confirmArchive() {
    Alert.alert('Archive tax rate?', `"${bracket?.name}" will no longer appear when adding new line items.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archive(id, true);
          router.back();
        },
      },
    ]);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSaving(true);
    await update(id, { name: name.trim(), rate_bp: parseRateBp(rate) });
    setIsSaving(false);
    router.back();
  }

  if (!bracket) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-grouped p-4 gap-4">
      <View>
        <Text className="text-xs text-secondary mb-1">Name</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View>
        <Text className="text-xs text-secondary mb-1">Rate %</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          keyboardType="decimal-pad"
          value={rate}
          onChangeText={setRate}
        />
        <Text className="text-xs text-secondary mt-1">Currently {formatRateBp(bracket.rate_bp)}</Text>
      </View>
      <Button
        label={isSaving ? 'Saving…' : 'Save'}
        variant="filled"
        size="large"
        disabled={isSaving || !name.trim()}
        onPress={handleSubmit}
      />
    </View>
  );
}
