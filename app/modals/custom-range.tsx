import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../src/components/Button';
import { DateField } from '../../src/components/DateField';
import { useReportsStore } from '../../src/stores/useReportsStore';

export default function CustomRangeModal() {
  const setPeriod = useReportsStore((s) => s.setPeriod);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const canApply = !!startDate && !!endDate && startDate <= endDate;

  async function apply() {
    if (!startDate || !endDate) return;
    await setPeriod({
      kind: 'custom',
      startIso: new Date(startDate).toISOString(),
      endIso: new Date(`${endDate}T23:59:59.999`).toISOString(),
    });
    router.back();
  }

  return (
    <View className="flex-1 bg-surface p-4 gap-4">
      <Text className="text-lg font-semibold text-gray-900">Custom Date Range</Text>
      <DateField label="Start Date" value={startDate} onChange={setStartDate} />
      <DateField label="End Date" value={endDate} onChange={setEndDate} />
      {startDate && endDate && startDate > endDate ? (
        <Text className="text-xs text-red-500">Start date must be before end date.</Text>
      ) : null}
      <Button label="Apply" size="large" disabled={!canApply} onPress={apply} />
    </View>
  );
}
