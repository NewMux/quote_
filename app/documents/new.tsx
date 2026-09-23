import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
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
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator size="large" accessibilityLabel="Creating Document" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingTop: 24 }}
    >
      <Text className="text-title2 font-bold text-label text-center mb-6" accessibilityRole="header">
        What Would You Like to Create?
      </Text>
      <ListSection>
        <ListRow
          icon="doc.plaintext.fill"
          title="Estimate"
          subtitle="A quote you can convert to an invoice later"
          onPress={() => handleChoose('estimate')}
        />
        <ListRow
          icon="doc.text.fill"
          title="Invoice"
          subtitle="A bill your client can pay"
          onPress={() => handleChoose('invoice')}
        />
      </ListSection>
    </ScrollView>
  );
}
