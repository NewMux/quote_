import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createDraftDocument } from '../../src/db/repositories/documents.repo';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import type { DocType } from '../../src/types/models';

export default function NewDocumentScreen() {
  const { type } = useLocalSearchParams<{ type?: DocType }>();
  const profile = useBusinessProfileStore((s) => s.profile);
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
    if (type && profile && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      handleChoose(type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, profile]);

  if (isCreating || !profile || type) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface p-6 justify-center gap-4">
      <Text className="text-lg font-semibold text-gray-900 text-center mb-4">
        What would you like to create?
      </Text>
      <Pressable onPress={() => handleChoose('estimate')} className="bg-white border border-gray-200 rounded-2xl p-6 items-center">
        <Text className="text-lg font-semibold text-gray-900">Estimate</Text>
        <Text className="text-sm text-gray-500 mt-1">A quote you can convert to an invoice later</Text>
      </Pressable>
      <Pressable onPress={() => handleChoose('invoice')} className="bg-white border border-gray-200 rounded-2xl p-6 items-center">
        <Text className="text-lg font-semibold text-gray-900">Invoice</Text>
        <Text className="text-sm text-gray-500 mt-1">A bill your client can pay</Text>
      </Pressable>
    </View>
  );
}
