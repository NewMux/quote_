import { useEffect } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DateField } from '../../../src/components/DateField';
import { LineItemEditor } from '../../../src/components/LineItemEditor';
import { computeDocumentTotals } from '../../../src/lib/documentCalculations';
import { formatMinor, parseToMinor } from '../../../src/lib/money';
import { useDocumentEditorStore } from '../../../src/stores/useDocumentEditorStore';
import { useTaxBracketsStore } from '../../../src/stores/useTaxBracketsStore';

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

  if (editor.isLoading || !editor.documentId) {
    return <View className="flex-1 bg-white" />;
  }

  const totals = computeDocumentTotals(editor.lines, editor.discountType, editor.discountValue);

  async function handleDone() {
    if (editor.isDirty) {
      await editor.save();
    }
    router.replace(`/documents/${id}`);
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Client</Text>
          <Pressable
            onPress={() => router.push('/modals/client-picker')}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <Text className={editor.clientNameSnapshot ? 'text-gray-900' : 'text-gray-400'}>
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
            <Text className="text-sm font-semibold text-gray-900">Line Items</Text>
            <Pressable
              onPress={() => router.push('/modals/item-picker')}
              className="bg-brand rounded-full px-4 py-1.5"
            >
              <Text className="text-white text-sm font-medium">+ Add Item</Text>
            </Pressable>
          </View>
          {editor.lines.length === 0 ? (
            <Text className="text-sm text-gray-400 py-4 text-center">No line items yet.</Text>
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
          onChange={editor.setDocumentDiscount}
        />

        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <TotalsRow label="Subtotal" valueMinor={totals.subtotalMinor} currencyCode={editor.currencyCode} />
          {totals.discountAmountMinor > 0 ? (
            <TotalsRow
              label="Discount"
              valueMinor={-totals.discountAmountMinor}
              currencyCode={editor.currencyCode}
            />
          ) : null}
          <TotalsRow label="Tax" valueMinor={totals.taxTotalMinor} currencyCode={editor.currencyCode} />
          <View className="border-t border-gray-200 mt-2 pt-2">
            <TotalsRow label="Total" valueMinor={totals.totalMinor} currencyCode={editor.currencyCode} bold />
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Notes (optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            value={editor.notes}
            onChangeText={editor.setNotes}
            multiline
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Terms Override (optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            value={editor.termsOverride}
            onChangeText={editor.setTermsOverride}
            multiline
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Pressable onPress={handleDone} className="bg-brand rounded-lg py-3 items-center">
          <Text className="text-white font-semibold">Done</Text>
        </Pressable>
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
      <Text className={bold ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-600'}>{label}</Text>
      <Text className={bold ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-900'}>
        {formatMinor(valueMinor, currencyCode)}
      </Text>
    </View>
  );
}

function DocumentDiscountEditor({
  discountType,
  discountValue,
  onChange,
}: {
  discountType: 'percent' | 'fixed' | null;
  discountValue: number | null;
  onChange: (type: 'percent' | 'fixed' | null, value: number | null) => void;
}) {
  const enabled = discountType !== null;
  return (
    <View className="bg-white rounded-xl p-4 border border-gray-100">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-900">Document Discount</Text>
        <Switch
          value={enabled}
          onValueChange={(value) => onChange(value ? 'fixed' : null, value ? 0 : null)}
        />
      </View>
      {enabled ? (
        <View className="flex-row gap-2 items-center">
          <Pressable
            onPress={() => onChange('percent', discountValue ?? 0)}
            className={`px-3 py-2 rounded-full border ${discountType === 'percent' ? 'bg-brand border-brand' : 'border-gray-300'}`}
          >
            <Text className={discountType === 'percent' ? 'text-white text-sm' : 'text-gray-700 text-sm'}>%</Text>
          </Pressable>
          <Pressable
            onPress={() => onChange('fixed', discountValue ?? 0)}
            className={`px-3 py-2 rounded-full border ${discountType === 'fixed' ? 'bg-brand border-brand' : 'border-gray-300'}`}
          >
            <Text className={discountType === 'fixed' ? 'text-white text-sm' : 'text-gray-700 text-sm'}>$</Text>
          </Pressable>
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
            keyboardType="decimal-pad"
            value={
              discountType === 'percent'
                ? String((discountValue ?? 0) / 100)
                : (((discountValue ?? 0) / 100).toFixed(2))
            }
            onChangeText={(text) => {
              const numeric = Number.parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
              const minorOrBp = discountType === 'percent' ? Math.round(numeric * 100) : parseToMinor(text);
              onChange(discountType, minorOrBp);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
