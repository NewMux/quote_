import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { DateField } from '../../../../src/components/DateField';
import { FormRow } from '../../../../src/components/form/FormRow';
import { FormScrollView } from '../../../../src/components/form/FormScrollView';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { LineItemEditor } from '../../../../src/components/LineItemEditor';
import { computeDocumentTotals, getTaxLabel } from '../../../../src/lib/documentCalculations';
import { formatMinor, getCurrencySymbol, minorToDecimalString, parseToMinor } from '../../../../src/lib/money';
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
      <ListSection header="Client" footer="Changes save automatically.">
        <ListRow
          icon="person.crop.circle.fill"
          title={editor.clientNameSnapshot ?? 'Choose Client'}
          onPress={() => router.push('/modals/client-picker')}
          accessibilityHint="Opens your client list"
        />
      </ListSection>

      <ListSection header="Dates">
        <DateField label="Issue Date" value={editor.issueDate} onChange={editor.setIssueDate} />
        {editor.docType === 'invoice' ? (
          <DateField label="Due Date" value={editor.dueDate} onChange={editor.setDueDate} />
        ) : (
          <DateField label="Valid Until" value={editor.expiryDate} onChange={editor.setExpiryDate} />
        )}
      </ListSection>

      {editor.lines.map((line, index) => (
        <LineItemEditor
          key={line.id}
          line={line}
          position={index + 1}
          taxBrackets={taxBrackets}
          currencyCode={editor.currencyCode}
          onChange={(patch) => editor.updateLineItem(line.id, patch)}
          onRemove={() => editor.removeLineItem(line.id)}
        />
      ))}

      <ListSection footer={editor.lines.length === 0 ? 'Add what you’re billing for from your item catalog or as a one-off.' : undefined}>
        <ListRow
          icon="plus.circle.fill"
          title="Add Item"
          onPress={() => router.push('/modals/item-picker')}
          accessory="none"
        />
      </ListSection>

      <DocumentDiscountEditor
        discountType={editor.discountType}
        discountValue={editor.discountValue}
        currencyCode={editor.currencyCode}
        onChange={editor.setDocumentDiscount}
      />

      <ListSection header="Summary">
        <ListRow title="Subtotal" value={formatMinor(totals.subtotalMinor, editor.currencyCode)} />
        {totals.discountAmountMinor > 0 ? (
          <ListRow title="Discount" value={formatMinor(-totals.discountAmountMinor, editor.currencyCode)} />
        ) : null}
        <ListRow
          title={getTaxLabel(editor.lines.map((l) => ({ isTaxable: l.isTaxable, taxName: l.taxBracketNameSnapshot })))}
          value={formatMinor(totals.taxTotalMinor, editor.currencyCode)}
        />
        <ListRow title="Total" value={formatMinor(totals.totalMinor, editor.currencyCode)} emphasized />
      </ListSection>

      <ListSection footer="Terms: leave blank to use the default terms from your Business Profile.">
        <FormRow label="Notes" value={editor.notes} onChangeText={editor.setNotes} placeholder="Shown on the document" multiline />
        <FormRow
          label="Terms"
          value={editor.termsOverride}
          onChangeText={editor.setTermsOverride}
          placeholder="Default terms"
          multiline
        />
      </ListSection>
    </FormScrollView>
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
    <ListSection>
      <ListRow
        title="Discount"
        switchValue={enabled}
        onSwitchChange={(value) => onChange(value ? 'fixed' : null, value ? 0 : null)}
      />
      {enabled ? (
        <View className="px-4 py-2.5">
          <SegmentedControl
            values={['Percent', `Amount (${getCurrencySymbol(currencyCode)})`]}
            selectedIndex={discountType === 'percent' ? 0 : 1}
            onChange={(e) => onChange(e.nativeEvent.selectedSegmentIndex === 0 ? 'percent' : 'fixed', 0)}
          />
        </View>
      ) : null}
      {enabled ? (
        <FormRow
          label={discountType === 'percent' ? 'Percent' : 'Amount'}
          prefix={discountType === 'percent' ? undefined : getCurrencySymbol(currencyCode)}
          keyboardType="decimal-pad"
          placeholder="0"
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
      ) : null}
    </ListSection>
  );
}
