import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { computeLineItem } from '../lib/documentCalculations';
import { formatMinor } from '../lib/money';
import { MoneyInput } from './MoneyInput';
import type { LineItemEditable, TaxBracket } from '../types/models';

interface LineItemEditorProps {
  line: LineItemEditable;
  taxBrackets: TaxBracket[];
  currencyCode: string;
  onChange: (patch: Partial<LineItemEditable>) => void;
  onRemove: () => void;
}

export function LineItemEditor({ line, taxBrackets, currencyCode, onChange, onRemove }: LineItemEditorProps) {
  const computed = computeLineItem(line);

  return (
    <View className="border border-gray-200 rounded-xl p-3 mb-3 bg-white">
      <View className="flex-row items-start mb-2">
        <TextInput
          className="flex-1 text-base text-gray-900 mr-2"
          placeholder="Description"
          value={line.description}
          onChangeText={(description) => onChange({ description })}
          multiline
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text className="text-red-500 text-lg">×</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2 mb-2">
        <View className="w-20">
          <Text className="text-xs text-gray-500 mb-1">Qty</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900"
            keyboardType="decimal-pad"
            value={String(line.quantity)}
            onChangeText={(text) => {
              const qty = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
              onChange({ quantity: Number.isFinite(qty) ? qty : 0 });
            }}
          />
        </View>
        <View className="w-16">
          <Text className="text-xs text-gray-500 mb-1">Unit</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900"
            value={line.unitLabel ?? ''}
            onChangeText={(unitLabel) => onChange({ unitLabel: unitLabel || null })}
            placeholder="unit"
          />
        </View>
        <View className="flex-1">
          <MoneyInput
            label="Rate"
            valueMinor={line.unitPriceMinor}
            onChangeMinor={(unitPriceMinor) => onChange({ unitPriceMinor })}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-gray-600">Taxable</Text>
        <Switch
          value={line.isTaxable}
          onValueChange={(isTaxable) =>
            onChange({
              isTaxable,
              taxBracketId: isTaxable ? line.taxBracketId : null,
              taxRateBp: isTaxable ? line.taxRateBp : 0,
            })
          }
        />
      </View>

      {line.isTaxable ? (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {taxBrackets.map((bracket) => {
            const selected = bracket.id === line.taxBracketId;
            return (
              <Pressable
                key={bracket.id}
                onPress={() =>
                  onChange({
                    taxBracketId: bracket.id,
                    taxBracketNameSnapshot: bracket.name,
                    taxRateBp: bracket.rate_bp,
                  })
                }
                className={`px-3 py-1 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
              >
                <Text className={selected ? 'text-white text-xs' : 'text-gray-700 text-xs'}>
                  {bracket.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="flex-row justify-end">
        <Text className="text-sm font-semibold text-gray-900">
          {formatMinor(computed.lineTotalMinor, currencyCode)}
        </Text>
      </View>
    </View>
  );
}
