import { useEffect } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Button } from '../../../../src/components/Button';
import { DateField } from '../../../../src/components/DateField';
import { LineItemEditor } from '../../../../src/components/LineItemEditor';
import { computeDocumentTotals, getTaxLabel } from '../../../../src/lib/documentCalculations';
import { formatMinor, getCurrencySymbol, minorToDecimalString, parseToMinor } from '../../../../src/lib/money';
import { BRAND } from '../../../../src/lib/theme';
import { useDocumentEditorStore } from '../../../../src/stores/useDocumentEditorStore';
import { useTaxBracketsStore } from '../../../../src/stores/useTaxBracketsStore';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
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

  useEffect(() => {
    if (editor.docNumber) navigation.setOptions({ title: `Edit ${editor.docNumber}` });
  }, [navigation, editor.docNumber]);

  if (editor.isLoading || !editor.documentId) {
    return <View className="flex-1 bg-card" />;
  }

  const totals = computeDocumentTotals(editor.lines, editor.discountType, editor.discountValue);

  async function handleDone() {
    if (editor.isDirty) {
      await editor.save();
    }
    router.replace(`/documents/${id}`);
  }

  return (
    <View className="flex-1 bg-grouped">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <View className="bg-card rounded-xl p-4 border border-separator">
          <Text className="text-xs text-secondary mb-1">Client</Text>
          <Pressable
            onPress={() => router.push('/modals/client-picker')}
            className="border border-field rounded-lg px-3 py-2"
          >
            <Text className={editor.clientNameSnapshot ? 'text-label' : 'text-secondary'}>
              {editor.clientNameSnapshot ?? 'Select a client'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <DateField label="Issue Date" value={editor.issueDate} onChange={editor.setIssueDate} />
          </View>
          <View className="flex-1">
            {editor.docType === 'invoice' ? (
              <DateField label="Due Date" value={editor.dueDate} onChange={editor.setDueDate} />
            ) : (
              <DateField label="Valid Until" value={editor.expiryDate} onChange={editor.setExpiryDate} />
            )}
          </View>
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-label">Line Items</Text>
            <Button label="+ Add Item" variant="tinted" onPress={() => router.push('/modals/item-picker')} />
          </View>
          {editor.lines.length === 0 ? (
            <Text className="text-sm text-secondary py-4 text-center">No line items yet.</Text>
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

        <View className="bg-card rounded-xl p-4 border border-separator">
          <TotalsRow label="Subtotal" valueMinor={totals.subtotalMinor} currencyCode={editor.currencyCode} />
          {totals.discountAmountMinor > 0 ? (
            <TotalsRow
              label="Discount"
              valueMinor={-totals.discountAmountMinor}
              currencyCode={editor.currencyCode}
            />
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

        <View>
          <Text className="text-xs text-secondary mb-1">Notes (optional)</Text>
          <TextInput
            className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
            value={editor.notes}
            onChangeText={editor.setNotes}
            multiline
          />
        </View>

        <View>
          <Text className="text-xs text-secondary mb-1">Custom Terms for This Document (optional)</Text>
          <TextInput
            className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
            value={editor.termsOverride}
            onChangeText={editor.setTermsOverride}
            multiline
            placeholder="Leave blank to use your default terms from Business Profile"
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-card border-t border-separator gap-2">
        <Text className="text-xs text-secondary text-center">Changes save automatically as you go</Text>
        <Button label="Done" variant="filled" size="large" onPress={handleDone} />
      </View>
    </View>
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
    <View className="bg-card rounded-xl p-4 border border-separator">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-label">Document Discount</Text>
        <Switch
          value={enabled}
          onValueChange={(value) => onChange(value ? 'fixed' : null, value ? 0 : null)}
        />
      </View>
      {enabled ? (
        <View className="gap-2">
          <Text className="text-xs text-secondary">Discount Type</Text>
          <View className="flex-row gap-2 items-center">
            <View style={{ width: 90 }}>
              <SegmentedControl
                values={['%', getCurrencySymbol(currencyCode)]}
                selectedIndex={discountType === 'percent' ? 0 : 1}
                tintColor={BRAND.default}
                activeFontStyle={{ color: '#FFFFFF' }}
                onChange={(e) => onChange(e.nativeEvent.selectedSegmentIndex === 0 ? 'percent' : 'fixed', 0)}
              />
            </View>
            <TextInput
              className="flex-1 border border-field rounded-lg px-3 py-2 text-base text-label"
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
        </View>
      ) : null}
    </View>
  );
}
