import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BarChart } from '../../../src/components/charts/BarChart';
import { LineChart } from '../../../src/components/charts/LineChart';
import { Card } from '../../../src/components/Card';
import { StatStrip } from '../../../src/components/StatStrip';
import { formatMinor } from '../../../src/lib/money';
import { BRAND } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { ReportGranularity } from '../../../src/db/repositories/reports.repo';

const GRANULARITIES: Array<{ label: string; value: ReportGranularity }> = [
  { label: 'D', value: 'day' },
  { label: 'W', value: 'week' },
  { label: 'M', value: 'month' },
  { label: 'Y', value: 'year' },
];

export default function HomeScreen() {
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
  const { breakdown, revenueByMonth, paidByPeriod, granularity, load, setGranularity } = useReportsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const receivedThisMonth = revenueByMonth[revenueByMonth.length - 1]?.value ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <LinearGradient
        colors={[BRAND.default, BRAND.darker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20 }}
      >
        <Text className="text-white text-lg font-bold mb-1">{monthLabel} Report</Text>
        <Text className="text-white/60 text-xs mb-4">Overview of your invoices</Text>
        {breakdown ? (
          <StatStrip
            items={[
              { label: 'Paid', value: formatMinor(breakdown.paidMinor, currencyCode) },
              { label: 'Unpaid', value: formatMinor(breakdown.unpaidMinor, currencyCode) },
              { label: 'Overdue', value: formatMinor(breakdown.overdueMinor, currencyCode) },
            ]}
          />
        ) : null}
      </LinearGradient>

      <Card>
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-xs text-gray-500">Received</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {formatMinor(receivedThisMonth, currencyCode)}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1">Monthly</Text>
        </View>
        <LineChart data={revenueByMonth} />
      </Card>

      <Card>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-semibold text-gray-900">Paid</Text>
          <View style={{ width: 140 }}>
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
  );
}
