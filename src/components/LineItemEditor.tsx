import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
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
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="w-11 h-11 items-center justify-center -mr-2 -mt-1"
        >
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
        <View className="w-20">
          <Text className="text-xs text-gray-500 mb-1">Per</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900"
            value={line.unitLabel ?? ''}
            onChangeText={(unitLabel) => onChange({ unitLabel: unitLabel || null })}
            placeholder="hr, item"
          />
        </View>
        <View className="flex-1">
          <MoneyInput
            label="Rate"
            valueMinor={line.unitPriceMinor}
            currencyCode={currencyCode}
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
        <View className="flex-row flex-wrap gap-2 mb-2 items-center">
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
                hitSlop={4}
                className={`px-3 py-2 min-h-[32px] justify-center rounded-full border ${selected ? 'bg-brand border-brand' : 'border-gray-300'}`}
              >
                <Text className={selected ? 'text-white text-xs' : 'text-gray-700 text-xs'}>
                  {bracket.name}
                </Text>
              </Pressable>
            );
          })}
          {taxBrackets.length <= 1 ? (
            <Pressable onPress={() => router.push('/settings/tax-brackets')}>
              <Text className="text-brand text-xs font-medium">+ Add a tax rate</Text>
            </Pressable>
          ) : null}
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
