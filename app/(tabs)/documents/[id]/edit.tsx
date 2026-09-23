import { useEffect } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Button } from '../../../../src/components/Button';
import { DateField } from '../../../../src/components/DateField';
import { FormField } from '../../../../src/components/form/FormField';
import { FormScrollView } from '../../../../src/components/form/FormScrollView';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { LineItemEditor } from '../../../../src/components/LineItemEditor';
import { computeDocumentTotals, getTaxLabel } from '../../../../src/lib/documentCalculations';
import { formatMinor, getCurrencySymbol, minorToDecimalString, parseToMinor } from '../../../../src/lib/money';
import { BRAND } from '../../../../src/lib/theme';
import { useSaveHeader } from '../../../../src/lib/useSaveHeader';
import { useDocumentEditorStore } from '../../../../src/stores/useDocumentEditorStore';
import { useTaxBracketsStore } from '../../../../src/stores/useTaxBracketsStore';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const editor = useDocumentEditorStore();
  const { taxBrackets, load: loadTaxBrackets } = useTaxBracketsStore();

  useEffect(() => {
    editor.loadDocument(id);
    loadTaxBrackets();
    return () => {
      const state = useDocumentEditorStore.getState();
      if (state.isDirty) {
        state.save();
      }
      useDocumentEditorStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!editor.isDirty) return;
    const handle = setTimeout(() => {
      editor.save();
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.isDirty, editor.lines, editor.discountType, editor.discountValue, editor.notes, editor.termsOverride, editor.issueDate, editor.dueDate, editor.expiryDate, editor.clientId]);

  // Edits save automatically (above), so "Done" only closes the editor — after flushing any
  // change still inside the autosave delay.
  async function handleDone() {
    if (useDocumentEditorStore.getState().isDirty) {
      await useDocumentEditorStore.getState().save();
    }
    router.back();
  }

  useSaveHeader({ title: editor.docNumber ? `Edit ${editor.docNumber}` : undefined, label: 'Done', onSave: handleDone });

  if (editor.isLoading || !editor.documentId) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  const totals = computeDocumentTotals(editor.lines, editor.discountType, editor.discountValue);

  return (
    <FormScrollView>
      <Text className="text-sm text-secondary text-center">Changes save automatically.</Text>

      <View>
        <ListSection header="Client">
          <ListRow
            title={editor.clientNameSnapshot ?? 'Choose Client'}
            onPress={() => router.push('/modals/client-picker')}
            accessibilityHint="Opens your client list"
          />
        </ListSection>
      </View>

      <View className="gap-3">
        <DateField label="Issue Date" value={editor.issueDate} onChange={editor.setIssueDate} />
        {editor.docType === 'invoice' ? (
          <DateField label="Due Date" value={editor.dueDate} onChange={editor.setDueDate} />
        ) : (
          <DateField label="Valid Until" value={editor.expiryDate} onChange={editor.setExpiryDate} />
        )}
      </View>

      <View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-label" accessibilityRole="header">
            Line Items
          </Text>
          <Button label="Add Item" variant="tinted" onPress={() => router.push('/modals/item-picker')} />
        </View>
        {editor.lines.length === 0 ? (
          <Text className="text-base text-secondary py-4 text-center">No line items yet.</Text>
        ) : null}
        {editor.lines.map((line) => (
          <LineItemEditor
            key={line.id}
            line={line}
            taxBrackets={taxBrackets}
            currencyCode={editor.currencyCode}
            onChange={(patch) => editor.updateLineItem(line.id, patch)}
            onRemove={() => editor.removeLineItem(line.id)}
          />
        ))}
      </View>

      <DocumentDiscountEditor
        discountType={editor.discountType}
        discountValue={editor.discountValue}
        currencyCode={editor.currencyCode}
        onChange={editor.setDocumentDiscount}
      />

      <View className="bg-card rounded-2xl p-4">
        <TotalsRow label="Subtotal" valueMinor={totals.subtotalMinor} currencyCode={editor.currencyCode} />
        {totals.discountAmountMinor > 0 ? (
          <TotalsRow label="Discount" valueMinor={-totals.discountAmountMinor} currencyCode={editor.currencyCode} />
        ) : null}
        <TotalsRow
          label={getTaxLabel(editor.lines.map((l) => ({ isTaxable: l.isTaxable, taxName: l.taxBracketNameSnapshot })))}
          valueMinor={totals.taxTotalMinor}
          currencyCode={editor.currencyCode}
        />
        <View className="border-t border-separator mt-2 pt-2">
          <TotalsRow label="Total" valueMinor={totals.totalMinor} currencyCode={editor.currencyCode} bold />
        </View>
      </View>

      <FormField label="Notes" hint="Optional. Shown on the document." value={editor.notes} onChangeText={editor.setNotes} multiline />

      <FormField
        label="Terms for This Document"
        hint="Optional. Leave blank to use the default terms from Business Profile."
        value={editor.termsOverride}
        onChangeText={editor.setTermsOverride}
        multiline
      />
    </FormScrollView>
  );
}

function TotalsRow({
  label,
  valueMinor,
  currencyCode,
  bold,
}: {
  label: string;
  valueMinor: number;
  currencyCode: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={bold ? 'text-base font-semibold text-label' : 'text-sm text-secondary'}>{label}</Text>
      <Text className={bold ? 'text-base font-semibold text-label' : 'text-sm text-label'}>
        {formatMinor(valueMinor, currencyCode)}
      </Text>
    </View>
  );
}

function DocumentDiscountEditor({
  discountType,
  discountValue,
  currencyCode,
  onChange,
}: {
  discountType: 'percent' | 'fixed' | null;
  discountValue: number | null;
  currencyCode: string;
  onChange: (type: 'percent' | 'fixed' | null, value: number | null) => void;
}) {
  const enabled = discountType !== null;
  return (
    <View className="bg-card rounded-2xl p-4 gap-3">
      <View className="flex-row justify-between items-center min-h-[44px]">
        <Text className="text-[17px] text-label">Discount</Text>
        <Switch
          value={enabled}
          accessibilityLabel="Discount"
          trackColor={{ true: BRAND.default }}
          onValueChange={(value) => onChange(value ? 'fixed' : null, value ? 0 : null)}
        />
      </View>
      {enabled ? (
        <View className="gap-3">
          <SegmentedControl
            values={['Percent', `Amount (${getCurrencySymbol(currencyCode)})`]}
            selectedIndex={discountType === 'percent' ? 0 : 1}
            tintColor={BRAND.default}
            activeFontStyle={{ color: '#FFFFFF' }}
            onChange={(e) => onChange(e.nativeEvent.selectedSegmentIndex === 0 ? 'percent' : 'fixed', 0)}
          />
          <FormField
            label={discountType === 'percent' ? 'Discount (%)' : 'Discount Amount'}
            prefix={discountType === 'percent' ? undefined : getCurrencySymbol(currencyCode)}
            keyboardType="decimal-pad"
            value={
              discountType === 'percent'
                ? String((discountValue ?? 0) / 100)
                : minorToDecimalString(discountValue ?? 0, currencyCode)
            }
            onChangeText={(text) => {
              const numeric = Number.parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
              const minorOrBp =
                discountType === 'percent' ? Math.round(numeric * 100) : parseToMinor(text, currencyCode);
              onChange(discountType, minorOrBp);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

