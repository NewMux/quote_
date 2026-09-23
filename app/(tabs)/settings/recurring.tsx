import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '../../../src/components/EmptyState';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { listSchedules } from '../../../src/db/repositories/recurring.repo';
import { formatScheduleDate, frequencyLabel } from '../../../src/lib/recurrence';
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
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
    >
      {schedules.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="No Recurring Invoices"
          subtitle="Open an invoice, tap More, and choose Make Recurring to bill a client on a schedule."
        />
      ) : (
        <ListSection footer="A new draft is created on each date for you to review and send.">
          {schedules.map((item) => (
            <ListRow
              key={item.id}
              icon="repeat"
              title={`${item.client_name ?? 'No Client'} · ${item.template_doc_number}`}
              subtitle={`${frequencyLabel(item.frequency)} · Next ${formatScheduleDate(item.next_run_date)}`}
              onPress={() => router.push(`/documents/${item.template_document_id}`)}
            />
          ))}
        </ListSection>
      )}
    </ScrollView>
  );
}
