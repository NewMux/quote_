import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { computeLineItem } from '../lib/documentCalculations';
import { formatMinor, parseDecimalInput } from '../lib/money';
import { FormRow } from './form/FormRow';
import { ListRow } from './list/ListRow';
import { ListSection } from './list/ListSection';
import { MoneyInput } from './MoneyInput';
import type { LineItemEditable, TaxBracket } from '../types/models';
import { t } from '../lib/i18n';

interface LineItemEditorProps {
  line: LineItemEditable;
  /** 1-based position, for the section header. */
  position: number;
  taxBrackets: TaxBracket[];
  currencyCode: string;
  onChange: (patch: Partial<LineItemEditable>) => void;
  onRemove: () => void;
}

/** One line item as its own grouped section: what, how many, at what price, and its tax. */
export function LineItemEditor({ line, position, taxBrackets, currencyCode, onChange, onRemove }: LineItemEditorProps) {
  const computed = computeLineItem(line);
  // Quantity keeps its own text so partial input like "1." survives until it's a number.
  const [quantityText, setQuantityText] = useState(String(line.quantity));

  return (
    <ListSection header={t('Item {position}', { position })}>
      <FormRow
        label={t('Description')}
        value={line.description}
        onChangeText={(description) => onChange({ description })}
        placeholder={t("What you're billing for")}
        multiline
        maxLength={200}
      />
      <FormRow
        label={t('Quantity')}
        keyboardType="decimal-pad"
        value={quantityText}
        onChangeText={(text) => {
          setQuantityText(text);
          const qty = parseDecimalInput(text);
          onChange({ quantity: Number.isFinite(qty) ? qty : 0 });
        }}
        onEndEditing={() => setQuantityText(String(line.quantity))}
      />
      <FormRow
        label={t('Unit')}
        value={line.unitLabel ?? ''}
        onChangeText={(unitLabel) => onChange({ unitLabel: unitLabel || null })}
        placeholder={t('hour, item')}
        autoCapitalize="none"
        maxLength={20}
      />
      <MoneyInput
        label={t('Price')}
        valueMinor={line.unitPriceMinor}
        currencyCode={currencyCode}
        onChangeMinor={(unitPriceMinor) => onChange({ unitPriceMinor })}
      />
      <ListRow
        title={t('Taxable')}
        switchValue={line.isTaxable}
        onSwitchChange={(isTaxable) =>
          onChange({
            isTaxable,
            taxBracketId: isTaxable ? line.taxBracketId : null,
            taxRateBp: isTaxable ? line.taxRateBp : 0,
          })
        }
      />
      {line.isTaxable ? (
        <TaxRateChips
          taxBrackets={taxBrackets}
          selectedId={line.taxBracketId}
          onSelect={(bracket) =>
            onChange({ taxBracketId: bracket.id, taxBracketNameSnapshot: bracket.name, taxRateBp: bracket.rate_bp })
          }
        />
      ) : null}
      <ListRow title={t('Line Total')} value={formatMinor(computed.lineTotalMinor, currencyCode)} emphasized />
      <ListRow title={t('Remove Item')} onPress={onRemove} destructive centered />
    </ListSection>
  );
}

function TaxRateChips({
  taxBrackets,
  selectedId,
  onSelect,
  showSeparator,
}: {
  taxBrackets: TaxBracket[];
  selectedId: string | null;
  onSelect: (bracket: TaxBracket) => void;
  showSeparator?: boolean;
}) {
  return (
    <View>
      {showSeparator ? <View style={{ marginLeft: 16, height: 0.5 }} className="bg-separator" /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' }}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('Tax rate')}
      >
        {taxBrackets.map((bracket) => {
          const selected = bracket.id === selectedId;
          return (
            <Pressable
              key={bracket.id}
              onPress={() => onSelect(bracket)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`px-4 min-h-[36px] justify-center rounded-full ${selected ? 'bg-brand' : 'bg-secondaryfill'}`}
              hitSlop={4}
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
            <Text className="text-tint text-subhead font-medium">{t('Add Tax Rate')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
