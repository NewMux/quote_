import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../src/components/Button';
import { DateField } from '../../src/components/DateField';
import { SheetHeader } from '../../src/components/SheetHeader';
import { getClient } from '../../src/db/repositories/clients.repo';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';
import type { DocStatus } from '../../src/types/models';

const STATUS_OPTIONS: Array<{ label: string; value: DocStatus | 'overdue' | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Issued', value: 'issued' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Canceled', value: 'void' },
];

/** Every control here commits straight to useDocumentsStore's live filter — matching how the
 * search box and Estimates/Invoices toggle on the list screen already behave — so "Done" (not
 * "Cancel") is the right label for the way out. */
export default function DocumentFilterModal() {
  const { filter, setFilter } = useDocumentsStore();
  const [clientName, setClientName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const clientId = useDocumentsStore.getState().filter.clientId;
      if (!clientId) {
        setClientName(null);
        return;
      }
      getClient(clientId).then((c) => setClientName(c?.display_name ?? null));
    }, [])
  );

  function clearAll() {
    setFilter({ ...filter, status: undefined, clientId: undefined, dateFrom: undefined, dateTo: undefined });
  }

  const hasActiveFilter = !!(filter.status || filter.clientId || filter.dateFrom || filter.dateTo);

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title="Filter Documents" closeLabel="Done" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-2">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const selected = filter.status === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setFilter({ ...filter, status: opt.value })}
                  className={`px-3 py-2 rounded-full border ${
                    selected ? 'bg-brand border-brand' : 'border-gray-300'
                  }`}
                >
                  <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Client</Text>
          <Pressable
            onPress={() => router.push({ pathname: '/modals/client-picker', params: { mode: 'filter' } })}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <Text className={clientName ? 'text-gray-900' : 'text-gray-500'}>{clientName ?? 'All Clients'}</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <DateField
              label="From"
              value={filter.dateFrom ?? null}
              onChange={(d) => setFilter({ ...filter, dateFrom: d })}
            />
          </View>
          <View className="flex-1">
            <DateField
              label="To"
              value={filter.dateTo ?? null}
              onChange={(d) => setFilter({ ...filter, dateTo: d })}
            />
          </View>
        </View>

        {hasActiveFilter ? <Button label="Clear All" variant="plain" onPress={clearAll} /> : null}
      </ScrollView>
    </View>
  );
}
