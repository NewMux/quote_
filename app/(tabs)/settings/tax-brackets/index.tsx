import { useCallback, useLayoutEffect } from 'react';
import { Platform, ScrollView } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { EmptyState } from '../../../../src/components/EmptyState';
import { HeaderButton } from '../../../../src/components/HeaderButton';
import { ListRow } from '../../../../src/components/list/ListRow';
import { ListSection } from '../../../../src/components/list/ListSection';
import { addButtonItem } from '../../../../src/lib/headerItems';
import { formatRateBp } from '../../../../src/lib/money';
import { useTaxBracketsStore } from '../../../../src/stores/useTaxBracketsStore';

function addTaxRate() {
  router.push('/settings/tax-brackets/new');
}

export default function TaxBracketsScreen() {
  const navigation = useNavigation();
  const { taxBrackets, load } = useTaxBracketsStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [addButtonItem('Add Tax Rate', addTaxRate)],
      headerRight:
        Platform.OS === 'ios' ? undefined : () => <HeaderButton icon="add" label="Add Tax Rate" onPress={addTaxRate} />,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
    >
      {taxBrackets.length === 0 ? (
        <EmptyState
          icon="calculator-outline"
          title="No Tax Rates Yet"
          subtitle="Add the sales tax or VAT rates you charge."
          actionLabel="Add Tax Rate"
          onAction={addTaxRate}
        />
      ) : (
        <ListSection footer="The default rate is applied to new taxable items. Tap a rate to edit it or make it the default.">
          {taxBrackets.map((item) => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={item.is_default ? 'Default' : undefined}
              value={formatRateBp(item.rate_bp)}
              onPress={() => router.push(`/settings/tax-brackets/${item.id}/edit`)}
            />
          ))}
        </ListSection>
      )}
    </ScrollView>
  );
}
