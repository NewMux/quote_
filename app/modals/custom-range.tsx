import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { DateField } from '../../src/components/DateField';
import { FormScrollView } from '../../src/components/form/FormScrollView';
import { SheetHeader } from '../../src/components/SheetHeader';
import { toStoredDate } from '../../src/lib/format';
import { useReportsStore } from '../../src/stores/useReportsStore';

function firstOfThisMonth(): string {
  const now = new Date();
  return toStoredDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export default function CustomRangeModal() {
  const setPeriod = useReportsStore((s) => s.setPeriod);
  const [startDate, setStartDate] = useState<string | null>(firstOfThisMonth());
  const [endDate, setEndDate] = useState<string | null>(toStoredDate(new Date()));

  const isBackwards = !!startDate && !!endDate && startDate > endDate;
  const canApply = !!startDate && !!endDate && !isBackwards;

  async function apply() {
    if (!startDate || !endDate) return;
    // Both ends are the local calendar day: midnight at the start, the last millisecond at the end.
    await setPeriod({
      kind: 'custom',
      startIso: new Date(`${startDate}T00:00:00`).toISOString(),
      endIso: new Date(`${endDate}T23:59:59.999`).toISOString(),
    });
    router.back();
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="Custom Range" actionLabel="Apply" onAction={apply} actionDisabled={!canApply} />
      <FormScrollView contentContainerStyle={{ gap: 12 }}>
        <DateField label="Start Date" value={startDate} onChange={setStartDate} />
        <DateField label="End Date" value={endDate} onChange={setEndDate} />
        {isBackwards ? (
          <Text className="text-sm text-destructive">The start date needs to be on or before the end date.</Text>
        ) : null}
      </FormScrollView>
    </View>
  );
}
