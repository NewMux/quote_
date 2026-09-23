import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import type { FormState } from '../../../src/components/form/useFormState';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { SettlementForm, type SettlementFormValue } from '../../../src/components/SettlementForm';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { getDocument } from '../../../src/db/repositories/documents.repo';
import {
  createSettlement,
  deleteSettlement,
  getSettlement,
  updateSettlement,
} from '../../../src/db/repositories/settlements.repo';
import { useUnsavedChangesGuard } from '../../../src/lib/useUnsavedChangesGuard';
import type { DocumentRecord, Settlement } from '../../../src/types/models';

export default function SettlementFormScreen() {
  const { id, settlementId } = useLocalSearchParams<{ id: string; settlementId?: string }>();
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null | undefined>(settlementId ? undefined : null);
  const [form, setForm] = useState<FormState<SettlementFormValue> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A new payment starts pre-filled, so leaving it untouched is fine; any edit is worth protecting.
  const leave = useUnsavedChangesGuard(!!form?.isDirty && !isSubmitting);
  const title = settlementId ? 'Edit Payment' : 'Log Payment';

  useEffect(() => {
    getDocument(id).then(setDocument);
    if (settlementId) {
      getSettlement(settlementId).then(setSettlement);
    }
  }, [id, settlementId]);

  async function handleSave() {
    if (!form?.canSubmit) return;
    setIsSubmitting(true);
    try {
      if (settlementId) {
        await updateSettlement(settlementId, id, form.value);
      } else {
        await createSettlement(id, form.value);
      }
      leave(() => router.back());
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Couldn’t Save Payment', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleDelete() {
    if (!settlementId) return;
    Alert.alert('Delete This Payment?', "The invoice's balance will be updated. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSettlement(settlementId, id);
            leave(() => router.back());
          } catch (err) {
            Alert.alert('Couldn’t Delete Payment', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }

  const isLoading = !document || settlement === undefined;

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader
        title={title}
        actionLabel={settlementId ? 'Save' : 'Add'}
        onAction={handleSave}
        actionDisabled={isLoading || !form?.canSubmit || isSubmitting}
      />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator accessibilityLabel="Loading" />
        </View>
      ) : (
        <FormScrollView>
          <SettlementForm
            currencyCode={document.currency_code}
            defaultAmountMinor={document.total_minor - document.amount_paid_minor}
            initial={settlement ?? undefined}
            onStateChange={setForm}
          />
          {settlementId ? (
            <ListSection>
              <ListRow title="Delete Payment" onPress={handleDelete} destructive centered />
            </ListSection>
          ) : null}
        </FormScrollView>
      )}
    </View>
  );
}
