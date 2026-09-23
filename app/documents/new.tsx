import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { createDraftDocument } from '../../src/db/repositories/documents.repo';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import { useSubscriptionStore } from '../../src/stores/useSubscriptionStore';
import type { DocType } from '../../src/types/models';

export default function NewDocumentScreen() {
  const { type } = useLocalSearchParams<{ type?: DocType }>();
  const profile = useBusinessProfileStore((s) => s.profile);
  // Reachable straight from onboarding, outside the tabs' subscription gate.
  const isPro = useSubscriptionStore((s) => s.isPro);
  const [isCreating, setIsCreating] = useState(false);
  const hasAutoTriggered = useRef(false);

  async function handleChoose(docType: DocType) {
    if (!profile || isCreating) return;
    setIsCreating(true);
    const doc = await createDraftDocument(docType, profile, null, null);
    setIsCreating(false);
    router.replace(`/documents/${doc.id}/edit`);
  }

  useEffect(() => {
    if (isPro && type && profile && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      handleChoose(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, type, profile]);

  if (!isPro) {
    return <Redirect href="/paywall" />;
  }

  if (isCreating || !profile || type) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-grouped p-6 justify-center gap-4">
      <Text className="text-lg font-semibold text-label text-center mb-4">
        What would you like to create?
      </Text>
      <Pressable onPress={() => handleChoose('estimate')} className="bg-card border border-separator rounded-2xl p-6 items-center">
        <Text className="text-lg font-semibold text-label">Estimate</Text>
        <Text className="text-sm text-secondary mt-1">A quote you can convert to an invoice later</Text>
      </Pressable>
      <Pressable onPress={() => handleChoose('invoice')} className="bg-card border border-separator rounded-2xl p-6 items-center">
        <Text className="text-lg font-semibold text-label">Invoice</Text>
        <Text className="text-sm text-secondary mt-1">A bill your client can pay</Text>
      </Pressable>
    </View>
  );
}
