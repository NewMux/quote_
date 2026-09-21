import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { formatRateBp, parseRateBp } from '../../src/lib/money';
import { useTaxBracketsStore } from '../../src/stores/useTaxBracketsStore';
import type { TaxBracket } from '../../src/types/models';

export default function TaxBracketsScreen() {
  const { taxBrackets, load, create, update, setDefault, archive } = useTaxBracketsStore();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(bracket: TaxBracket) {
    setEditingId(bracket.id);
    setName(bracket.name);
    setRate(String(bracket.rate_bp / 100));
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setRate('');
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    if (editingId) {
      await update(editingId, { name: name.trim(), rate_bp: parseRateBp(rate) });
    } else {
      await create({ name: name.trim(), rate_bp: parseRateBp(rate) });
    }
    cancelEdit();
  }

  function confirmArchive(bracket: TaxBracket) {
    Alert.alert('Archive tax bracket?', `"${bracket.name}" will no longer appear when adding new line items.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archive(bracket.id, true) },
    ]);
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={taxBrackets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="text-xs text-gray-500 mb-2">{editingId ? 'Edit Tax Bracket' : 'Add Tax Bracket'}</Text>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Name (e.g. Standard)"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-base"
                placeholder="Rate %"
                keyboardType="decimal-pad"
                value={rate}
                onChangeText={setRate}
              />
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button label={editingId ? 'Save' : 'Add'} variant="filled" onPress={handleSubmit} />
              </View>
              {editingId ? (
                <View className="flex-1">
                  <Button label="Cancel" variant="tinted" onPress={cancelEdit} />
                </View>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => startEdit(item)}>
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-500">{formatRateBp(item.rate_bp)}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                {item.is_default ? (
                  <Text className="text-xs text-brand font-semibold">Default</Text>
                ) : (
                  <Button label="Set default" variant="plain" size="small" onPress={() => setDefault(item.id)} />
                )}
                <Button label="Archive" variant="destructive" size="small" onPress={() => confirmArchive(item)} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
