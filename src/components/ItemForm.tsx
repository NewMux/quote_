import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { MoneyInput } from './MoneyInput';
import { useTaxBracketsStore } from '../stores/useTaxBracketsStore';
import type { ItemInput } from '../db/repositories/itemCatalog.repo';
import type { ItemCatalogEntry } from '../types/models';

interface ItemFormProps {
  initial?: ItemCatalogEntry;
  onSubmit: (input: ItemInput) => void;
  isSaving: boolean;
}

export function ItemForm({ initial, onSubmit, isSaving }: ItemFormProps) {
  const { taxBrackets, load } = useTaxBracketsStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priceMinor, setPriceMinor] = useState(initial?.default_unit_price_minor ?? 0);
  const [unitLabel, setUnitLabel] = useState(initial?.unit_label ?? 'unit');
  const [isTaxable, setIsTaxable] = useState(initial?.is_taxable === 1);
  const [taxBracketId, setTaxBracketId] = useState<string | null>(initial?.default_tax_bracket_id ?? null);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xs text-gray-500 mb-1">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View>
        <Text className="text-xs text-gray-500 mb-1">Description (optional)</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <MoneyInput label="Default Rate" valueMinor={priceMinor} onChangeMinor={setPriceMinor} />
        </View>
        <View className="w-24">
          <Text className="text-xs text-gray-500 mb-1">Unit</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            value={unitLabel}
            onChangeText={setUnitLabel}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-white rounded-lg border border-gray-300 px-3 py-3">
        <Text className="text-base text-gray-900">Taxable</Text>
        <Switch value={isTaxable} onValueChange={setIsTaxable} />
      </View>

      {isTaxable ? (
        <View>
          <Text className="text-xs text-gray-500 mb-2">Default Tax Bracket</Text>
          <View className="flex-row flex-wrap gap-2">
            {taxBrackets.map((bracket) => {
              const selected = bracket.id === taxBracketId;
              return (
                <Pressable
                  key={bracket.id}
                  onPress={() => setTaxBracketId(bracket.id)}
                  className={`px-3 py-2 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                >
                  <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{bracket.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Pressable
        disabled={isSaving || !name.trim()}
        onPress={() =>
          onSubmit({
            name: name.trim(),
            description: description || null,
            default_unit_price_minor: priceMinor,
            unit_label: unitLabel || 'unit',
            is_taxable: isTaxable,
            default_tax_bracket_id: isTaxable ? taxBracketId : null,
          })
        }
        className={`rounded-lg py-3 items-center ${name.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <Text className="text-white font-semibold">{isSaving ? 'Saving…' : 'Save Item'}</Text>
      </Pressable>
    </ScrollView>
  );
}
