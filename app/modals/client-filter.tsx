import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SheetScreen } from '../../src/components/SheetScreen';
import { useClientsStore } from '../../src/stores/useClientsStore';
import { t } from '../../src/lib/i18n';

const SORT_OPTIONS: { label: string; value: 'name' | 'recent' }[] = [
  { label: t('Name'), value: 'name' },
  { label: t('Recently Added'), value: 'recent' },
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
    <SheetScreen
      header={
        <SheetHeader
          title={t('Filter Clients')}
          closeLabel={t('Reset')}
          onClose={reset}
          actionLabel={t('Done')}
          onAction={() => router.back()}
        />
      }
    >
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <ListSection header={t('Sort By')}>
          {SORT_OPTIONS.map((option) => (
            <ListRow
              key={option.value}
              title={option.label}
              onPress={() => setSortBy(option.value)}
              accessory={sortBy === option.value ? 'checkmark' : 'none'}
            />
          ))}
        </ListSection>
        <ListSection footer={t('Only show clients who owe you money on an issued invoice.')}>
          <ListRow title={t('Outstanding Balance Only')} switchValue={hasBalanceOnly} onSwitchChange={setHasBalanceOnly} />
        </ListSection>
      </ScrollView>
    </SheetScreen>
  );
}
