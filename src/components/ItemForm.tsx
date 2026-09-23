import { useEffect, useState, type ReactNode } from 'react';
import { FormRow } from './form/FormRow';
import { FormScrollView } from './form/FormScrollView';
import { useReportFormState, type FormState } from './form/useFormState';
import { ListRow } from './list/ListRow';
import { ListSection } from './list/ListSection';
import { MoneyInput } from './MoneyInput';
import { formatRateBp } from '../lib/money';
import { useBusinessProfileStore } from '../stores/useBusinessProfileStore';
import { useTaxBracketsStore } from '../stores/useTaxBracketsStore';
import type { ItemInput } from '../db/repositories/itemCatalog.repo';
import type { ItemCatalogEntry } from '../types/models';

interface ItemFormProps {
  initial?: ItemCatalogEntry;
  /** Receives the current input, validity, and dirtiness; the hosting screen owns the Save action. */
  onStateChange: (state: FormState<ItemInput>) => void;
  footer?: ReactNode;
}

export function ItemForm({ initial, onStateChange, footer }: ItemFormProps) {
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

  useReportFormState<ItemInput>(
    {
      name: name.trim(),
      description: description.trim() || null,
      default_unit_price_minor: priceMinor,
      unit_label: unitLabel.trim() || 'unit',
      is_taxable: isTaxable,
      default_tax_bracket_id: isTaxable ? taxBracketId : null,
    },
    !!name.trim(),
    onStateChange
  );

  return (
    <FormScrollView>
      <ListSection footer="The description appears under the item on invoices.">
        <FormRow
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Consultation"
          autoCapitalize="words"
          maxLength={100}
        />
        <FormRow
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          multiline
          maxLength={200}
        />
      </ListSection>

      <ListSection footer="The price and unit fill in when you add this item to a document; you can change them there.">
        <MoneyInput label="Price" valueMinor={priceMinor} currencyCode={currencyCode} onChangeMinor={setPriceMinor} />
        <FormRow
          label="Unit"
          value={unitLabel}
          onChangeText={setUnitLabel}
          placeholder="hour, item"
          autoCapitalize="none"
          maxLength={20}
        />
      </ListSection>

      <ListSection
        footer={isTaxable ? 'Choose the tax rate applied when you add this item to a document.' : undefined}
      >
        <ListRow title="Taxable" switchValue={isTaxable} onSwitchChange={setIsTaxable} />
        {isTaxable
          ? taxBrackets.map((bracket) => (
              <ListRow
                key={bracket.id}
                title={bracket.name}
                value={formatRateBp(bracket.rate_bp)}
                onPress={() => setTaxBracketId(bracket.id)}
                accessory={bracket.id === taxBracketId ? 'checkmark' : 'none'}
              />
            ))
          : null}
      </ListSection>
      {footer}
    </FormScrollView>
  );
}
