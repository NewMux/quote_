import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { formatRateBp, parseRateBp } from '../../src/lib/money';
import { useTaxBracketsStore } from '../../src/stores/useTaxBracketsStore';
import type { TaxBracket } from '../../src/types/models';

export default function TaxBracketsScreen() {
  const { taxBrackets, load, create, setDefault, archive } = useTaxBracketsStore();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!name.trim()) return;
    await create({ name: name.trim(), rate_bp: parseRateBp(rate) });
    setName('');
    setRate('');
  }

  function confirmArchive(bracket: TaxBracket) {
    Alert.alert('Archive tax bracket?', `"${bracket.name}" will no longer appear when adding new line items.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archive(bracket.id, true) },
    ]);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={taxBrackets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="text-xs text-gray-500 mb-2">Add Tax Bracket</Text>
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
            <Pressable onPress={handleAdd} className="bg-blue-600 rounded-lg py-2 items-center">
              <Text className="text-white font-semibold">Add</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-row justify-between items-center">
            <View>
              <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
              <Text className="text-sm text-gray-500">{formatRateBp(item.rate_bp)}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              {item.is_default ? (
                <Text className="text-xs text-blue-600 font-semibold">Default</Text>
              ) : (
                <Pressable onPress={() => setDefault(item.id)}>
                  <Text className="text-xs text-gray-500">Set default</Text>
                </Pressable>
              )}
              <Pressable onPress={() => confirmArchive(item)}>
                <Text className="text-xs text-red-500">Archive</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
