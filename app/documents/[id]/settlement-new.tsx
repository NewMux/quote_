import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SettlementForm, type SettlementFormValue } from '../../../src/components/SettlementForm';
import { SheetHeader } from '../../../src/components/SheetHeader';
import { getDocument } from '../../../src/db/repositories/documents.repo';
import {
  createSettlement,
  deleteSettlement,
  getSettlement,
  updateSettlement,
} from '../../../src/db/repositories/settlements.repo';
import type { DocumentRecord, Settlement } from '../../../src/types/models';

export default function SettlementFormScreen() {
  const { id, settlementId } = useLocalSearchParams<{ id: string; settlementId?: string }>();
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null | undefined>(settlementId ? undefined : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDocument(id).then(setDocument);
    if (settlementId) {
      getSettlement(settlementId).then(setSettlement);
    }
  }, [id, settlementId]);

  async function handleSubmit(value: SettlementFormValue) {
    setIsSubmitting(true);
    const input = {
      method: value.method,
      amountMinor: value.amountMinor,
      settledDate: value.settledDate,
      referenceNumber: value.referenceNumber,
      receiptPhotoUri: value.receiptPhotoUri,
      notes: value.notes,
    };
    if (settlementId) {
      await updateSettlement(settlementId, id, input);
    } else {
      await createSettlement(id, input);
    }
    setIsSubmitting(false);
    router.back();
  }

  function handleDelete() {
    if (!settlementId) return;
    Alert.alert('Delete this payment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSettlement(settlementId, id);
          router.back();
        },
      },
    ]);
  }

  if (!document || settlement === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <SheetHeader title={settlementId ? 'Edit Payment' : 'Log Payment'} />
        <ActivityIndicator style={{ flex: 1 }} />
      </View>
    );
  }

  const balanceDue = document.total_minor - document.amount_paid_minor;

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title={settlementId ? 'Edit Payment' : 'Log Payment'} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <SettlementForm
          currencyCode={document.currency_code}
          defaultAmountMinor={balanceDue}
          initial={settlement ?? undefined}
          onSubmit={handleSubmit}
          onDelete={settlementId ? handleDelete : undefined}
          isSubmitting={isSubmitting}
        />
      </ScrollView>
    </View>
  );
}
