import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SettlementForm, type SettlementFormValue } from '../../../src/components/SettlementForm';
import { getDocument } from '../../../src/db/repositories/documents.repo';
import { createSettlement } from '../../../src/db/repositories/settlements.repo';
import type { DocumentRecord } from '../../../src/types/models';

export default function NewSettlementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDocument(id).then(setDocument);
  }, [id]);

  async function handleSubmit(value: SettlementFormValue) {
    setIsSubmitting(true);
    await createSettlement(id, {
      method: value.method,
      amountMinor: value.amountMinor,
      settledDate: value.settledDate,
      referenceNumber: value.referenceNumber,
      receiptPhotoUri: value.receiptPhotoUri,
      notes: value.notes,
    });
    setIsSubmitting(false);
    router.back();
  }

  if (!document) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const balanceDue = document.total_minor - document.amount_paid_minor;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      <SettlementForm defaultAmountMinor={balanceDue} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </ScrollView>
  );
}
