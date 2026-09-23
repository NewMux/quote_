import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useClientsStore } from '../../src/stores/useClientsStore';

const SORT_OPTIONS: { label: string; value: 'name' | 'recent' }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Recently Added', value: 'recent' },
];

/** Every control applies immediately to the Clients list, so the sheet offers Reset and Done
 * rather than Cancel. */
export default function ClientFilterModal() {
  const { sortBy, setSortBy, hasBalanceOnly, setHasBalanceOnly } = useClientsStore();

  async function reset() {
    await setSortBy('name');
    await setHasBalanceOnly(false);
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader
        title="Filter Clients"
        closeLabel="Reset"
        onClose={reset}
        actionLabel="Done"
        onAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <ListSection header="Sort By">
          {SORT_OPTIONS.map((option) => (
            <ListRow
              key={option.value}
              title={option.label}
              onPress={() => setSortBy(option.value)}
              accessory={sortBy === option.value ? 'checkmark' : 'none'}
            />
          ))}
        </ListSection>
        <ListSection footer="Only show clients who owe you money on an issued invoice.">
          <ListRow title="Outstanding Balance Only" switchValue={hasBalanceOnly} onSwitchChange={setHasBalanceOnly} />
        </ListSection>
      </ScrollView>
    </View>
  );
}
