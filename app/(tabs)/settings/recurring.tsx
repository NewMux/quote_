import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { listSchedules } from '../../../src/db/repositories/recurring.repo';
import { formatScheduleDate, frequencyLabel } from '../../../src/lib/recurrence';
import { BRAND } from '../../../src/lib/theme';
import type { RecurringScheduleListItem } from '../../../src/types/models';

export default function RecurringInvoicesScreen() {
  const [schedules, setSchedules] = useState<RecurringScheduleListItem[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listSchedules()
        .then(setSchedules)
        .catch(() => setSchedules([]));
    }, [])
  );

  if (!schedules) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      data={schedules}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyState
          title="No recurring invoices"
          subtitle="Open an invoice, tap the ••• menu, and choose Make Recurring."
        />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/documents/${item.template_document_id}`)}>
          <Card className="flex-row items-center gap-3">
            <Ionicons name="repeat" size={20} color={BRAND.default} />
            <View className="flex-1">
              <Text className="text-base text-gray-900" numberOfLines={1}>
                {item.client_name ?? 'No client'} · {item.template_doc_number}
              </Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {frequencyLabel(item.frequency)} · next {formatScheduleDate(item.next_run_date)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Card>
        </Pressable>
      )}
    />
  );
}
