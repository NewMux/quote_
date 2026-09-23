import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { DateField } from '../../src/components/DateField';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SheetScreen } from '../../src/components/SheetScreen';
import { getClient } from '../../src/db/repositories/clients.repo';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';
import type { DocStatus } from '../../src/types/models';

const STATUS_OPTIONS: { label: string; value: DocStatus | 'overdue' | undefined }[] = [
  { label: 'All Statuses', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Issued', value: 'issued' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Canceled', value: 'void' },
];

/** Every control applies immediately to the Documents list (like its search field and type
 * switcher), so the sheet offers Reset and Done rather than Cancel. */
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

  function reset() {
    setFilter({ ...filter, status: undefined, clientId: undefined, dateFrom: undefined, dateTo: undefined });
    setClientName(null);
  }

  return (
    <SheetScreen
      header={
        <SheetHeader
          title="Filter Documents"
          closeLabel="Reset"
          onClose={reset}
          actionLabel="Done"
          onAction={() => router.back()}
        />
      }
    >
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <ListSection header="Status">
          {STATUS_OPTIONS.map((opt) => (
            <ListRow
              key={opt.label}
              title={opt.label}
              onPress={() => setFilter({ ...filter, status: opt.value })}
              accessory={filter.status === opt.value ? 'checkmark' : 'none'}
            />
          ))}
        </ListSection>

        <ListSection>
          <ListRow
            icon="person.crop.circle.fill"
            title="Client"
            value={clientName ?? 'All Clients'}
            onPress={() => router.push({ pathname: '/modals/client-picker', params: { mode: 'filter' } })}
          />
        </ListSection>

        <ListSection header="Issue Date">
          <DateField
            label="From"
            value={filter.dateFrom ?? null}
            emptyLabel="Any Date"
            onChange={(d) => setFilter({ ...filter, dateFrom: d })}
          />
          <DateField
            label="To"
            value={filter.dateTo ?? null}
            emptyLabel="Any Date"
            onChange={(d) => setFilter({ ...filter, dateTo: d })}
          />
        </ListSection>
      </ScrollView>
    </SheetScreen>
  );
}
