import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { MoneyInput } from './MoneyInput';
import { useBusinessProfileStore } from '../stores/useBusinessProfileStore';
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
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
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
    <ScrollView className="flex-1 bg-grouped" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xs text-secondary mb-1">Name</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
      </View>

      <View>
        <Text className="text-xs text-secondary mb-1">Description (optional)</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <MoneyInput
            label="Default Rate"
            valueMinor={priceMinor}
            currencyCode={currencyCode}
            onChangeMinor={setPriceMinor}
          />
        </View>
        <View className="w-24">
          <Text className="text-xs text-secondary mb-1">Per (hr, item)</Text>
          <TextInput
            className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
            value={unitLabel}
            onChangeText={setUnitLabel}
            maxLength={20}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-card rounded-lg border border-field px-3 py-3">
        <Text className="text-base text-label">Taxable</Text>
        <Switch value={isTaxable} onValueChange={setIsTaxable} />
      </View>

      {isTaxable ? (
        <View>
          <Text className="text-xs text-secondary mb-2">Default Tax Rate</Text>
          <View className="flex-row flex-wrap gap-2">
            {taxBrackets.map((bracket) => {
              const selected = bracket.id === taxBracketId;
              return (
                <Pressable
                  key={bracket.id}
                  onPress={() => setTaxBracketId(bracket.id)}
                  className={`px-3 py-2 rounded-full border ${selected ? 'bg-brand border-brand' : 'border-field'}`}
                >
                  <Text className={selected ? 'text-white text-sm' : 'text-label text-sm'}>{bracket.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Button
        label={isSaving ? 'Saving…' : 'Save Item'}
        variant="filled"
        size="large"
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
      />
    </ScrollView>
  );
}
