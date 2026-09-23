import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { computeLineItem } from '../lib/documentCalculations';
import { formatMinor } from '../lib/money';
import { BRAND, useThemeColors } from '../lib/theme';
import { FormField } from './form/FormField';
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
  const colors = useThemeColors();

  return (
    <View className="rounded-2xl p-3 mb-3 bg-card gap-3">
      <View className="flex-row items-start gap-1">
        <View className="flex-1">
          <FormField
            label="Description"
            value={line.description}
            onChangeText={(description) => onChange({ description })}
            multiline
            maxLength={200}
          />
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${line.description || 'Item'}`}
          hitSlop={4}
          className="w-11 h-11 items-center justify-center -mr-1"
        >
          <Icon name="minus.circle.fill" size={22} color={colors.destructive} />
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <FormField
            label="Qty"
            keyboardType="decimal-pad"
            value={String(line.quantity)}
            onChangeText={(text) => {
              const qty = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
              onChange({ quantity: Number.isFinite(qty) ? qty : 0 });
            }}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Unit"
            value={line.unitLabel ?? ''}
            onChangeText={(unitLabel) => onChange({ unitLabel: unitLabel || null })}
            placeholder="hour"
            autoCapitalize="none"
            maxLength={20}
          />
        </View>
        <View style={{ flex: 1.4 }}>
          <MoneyInput
            label="Price"
            valueMinor={line.unitPriceMinor}
            currencyCode={currencyCode}
            onChangeMinor={(unitPriceMinor) => onChange({ unitPriceMinor })}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between min-h-[44px]">
        <Text className="text-body text-label">Taxable</Text>
        <Switch
          value={line.isTaxable}
          accessibilityLabel="Taxable"
          trackColor={{ true: BRAND.default }}
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
        <View className="flex-row flex-wrap gap-2 items-center" accessibilityRole="radiogroup">
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
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                className={`px-4 min-h-[44px] justify-center rounded-full ${selected ? 'bg-brand' : 'bg-fill'}`}
              >
                <Text className={`text-subhead ${selected ? 'text-white font-semibold' : 'text-label'}`}>
                  {bracket.name}
                </Text>
              </Pressable>
            );
          })}
          {taxBrackets.length <= 1 ? (
            <Pressable
              onPress={() => router.push('/settings/tax-brackets/new')}
              accessibilityRole="button"
              className="min-h-[44px] justify-center px-1"
            >
              <Text className="text-tint text-subhead font-medium">Add Tax Rate</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row justify-between items-center border-t border-separator pt-2">
        <Text className="text-subhead text-secondary">Line Total</Text>
        <Text className="text-body font-semibold text-label">{formatMinor(computed.lineTotalMinor, currencyCode)}</Text>
      </View>
    </View>
  );
}
