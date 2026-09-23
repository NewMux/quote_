import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SheetHeader } from '../../src/components/SheetHeader';
import { BRAND } from '../../src/lib/theme';
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
          <Text className="text-subhead text-secondary px-4 mb-1.5" accessibilityRole="header">
            Sort By
          </Text>
          <SegmentedControl
            values={SORT_OPTIONS.map((o) => o.label)}
            selectedIndex={SORT_OPTIONS.findIndex((o) => o.value === sortBy)}
            tintColor={BRAND.default}
            activeFontStyle={{ color: '#FFFFFF' }}
            onChange={(e) => setSortBy(SORT_OPTIONS[e.nativeEvent.selectedSegmentIndex].value)}
          />
        </View>
        <ListSection footer="Only show clients who owe you money on an issued invoice.">
          <ListRow title="Outstanding Balance Only" switchValue={hasBalanceOnly} onSwitchChange={setHasBalanceOnly} />
        </ListSection>
      </ScrollView>
    </View>
  );
}
