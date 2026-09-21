import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BarChart } from '../../../src/components/charts/BarChart';
import { LineChart } from '../../../src/components/charts/LineChart';
import { Card } from '../../../src/components/Card';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { StatStrip } from '../../../src/components/StatStrip';
import { formatMinor } from '../../../src/lib/money';
import { formatPeriodLabel, type ReportPeriod } from '../../../src/lib/reportPeriods';
import { BRAND } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { ReportGranularity } from '../../../src/db/repositories/reports.repo';

const GRANULARITIES: Array<{ label: string; value: ReportGranularity }> = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const PERIODS: Array<{ label: string; kind: ReportPeriod['kind'] }> = [
  { label: 'This Month', kind: 'month' },
  { label: 'Last 90 Days', kind: 'last90' },
  { label: 'This Year', kind: 'year' },
  { label: 'Pick Dates…', kind: 'custom' },
];

export default function HomeScreen() {
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
  const { breakdown, revenueByMonth, paidByPeriod, granularity, period, load, setGranularity, setPeriod } =
    useReportsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const receivedThisMonth = revenueByMonth[revenueByMonth.length - 1]?.value ?? 0;

  function handlePeriodChange(index: number) {
    const chosen = PERIODS[index];
    if (chosen.kind === 'custom') {
      router.push('/modals/custom-range');
      return;
    }
    setPeriod({ kind: chosen.kind } as ReportPeriod);
  }

  const selectedPeriodIndex = PERIODS.findIndex((p) => p.kind === period.kind);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Home" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          values={PERIODS.map((p) => p.label)}
          selectedIndex={selectedPeriodIndex}
          tintColor={BRAND.default}
          onChange={(e) => handlePeriodChange(e.nativeEvent.selectedSegmentIndex)}
        />

        <LinearGradient
          colors={[BRAND.default, BRAND.darker]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20 }}
        >
          <Text className="text-white text-lg font-bold mb-1">{formatPeriodLabel(period)} Report</Text>
          <Text className="text-white/60 text-xs mb-4">Overview of your invoices</Text>
          <StatStrip
            items={[
              { label: 'Paid', value: formatMinor(breakdown.paidMinor, currencyCode) },
              { label: 'Unpaid', value: formatMinor(breakdown.unpaidMinor, currencyCode) },
              { label: 'Overdue', value: formatMinor(breakdown.overdueMinor, currencyCode) },
            ]}
          />
        </LinearGradient>

        <Card>
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-xs text-gray-500">Paid</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {formatMinor(receivedThisMonth, currencyCode)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">This month</Text>
          </View>
          <LineChart data={revenueByMonth} />
        </Card>

        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-gray-900">Paid</Text>
            <View style={{ width: 220 }}>
              <SegmentedControl
                values={GRANULARITIES.map((g) => g.label)}
                selectedIndex={GRANULARITIES.findIndex((g) => g.value === granularity)}
                tintColor={BRAND.default}
                onChange={(e) => setGranularity(GRANULARITIES[e.nativeEvent.selectedSegmentIndex].value)}
              />
            </View>
          </View>
          <BarChart data={paidByPeriod} />
        </Card>
      </ScrollView>
    </View>
  );
}
