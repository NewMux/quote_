import { useCallback, useLayoutEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BarChart } from '../../../src/components/charts/BarChart';
import { LineChart } from '../../../src/components/charts/LineChart';
import { Card } from '../../../src/components/Card';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { StatStrip } from '../../../src/components/StatStrip';
import { formatMinor } from '../../../src/lib/money';
import { formatPeriodLabel, type ReportPeriod } from '../../../src/lib/reportPeriods';
import { newDocumentMenuItem, showNewDocumentChooser } from '../../../src/lib/headerItems';
import { BRAND, useThemeColors } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { ReportGranularity } from '../../../src/db/repositories/reports.repo';

const GRANULARITIES: { label: string; value: ReportGranularity }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const PERIODS: { label: string; kind: ReportPeriod['kind'] }[] = [
  { label: 'This Month', kind: 'month' },
  { label: 'Last 90 Days', kind: 'last90' },
  { label: 'This Year', kind: 'year' },
];

/** "Paid by month: Apr, $1,200; May, $0; …" — the spoken equivalent of a chart. */
function describeSeries(title: string, data: { label: string; value: number }[], currencyCode: string) {
  if (data.length === 0) return `${title}: no data yet`;
  return `${title}: ${data.map((d) => `${d.label}, ${formatMinor(d.value, currencyCode)}`).join('; ')}`;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
  const { breakdown, revenueByMonth, paidByPeriod, granularity, period, load, setGranularity, setPeriod } =
    useReportsStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [newDocumentMenuItem()],
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => <HeaderButton icon="plus" label="New Document" onPress={showNewDocumentChooser} />,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await load();
    } finally {
      setIsRefreshing(false);
    }
  }

  const receivedThisMonth = revenueByMonth[revenueByMonth.length - 1]?.value ?? 0;

  function handlePeriodChange(index: number) {
    setPeriod({ kind: PERIODS[index].kind } as ReportPeriod);
  }

  const selectedPeriodIndex = PERIODS.findIndex((p) => p.kind === period.kind);

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SegmentedControl
            values={PERIODS.map((p) => p.label)}
            selectedIndex={selectedPeriodIndex}
            tintColor={BRAND.default}
            activeFontStyle={{ color: '#FFFFFF' }}
            onChange={(e) => handlePeriodChange(e.nativeEvent.selectedSegmentIndex)}
          />
        </View>
        <Pressable
          onPress={() => router.push('/modals/custom-range')}
          accessibilityRole="button"
          accessibilityLabel="Custom Date Range"
          accessibilityState={{ selected: period.kind === 'custom' }}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            period.kind === 'custom' ? 'bg-brand' : 'bg-fill'
          }`}
        >
          <Ionicons name="calendar-outline" size={20} color={period.kind === 'custom' ? '#FFFFFF' : colors.tint} />
        </Pressable>
      </View>

      <LinearGradient
        colors={[BRAND.default, BRAND.darker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20 }}
      >
        <Text className="text-white text-title3 font-bold mb-1" accessibilityRole="header">
          {formatPeriodLabel(period)} Report
        </Text>
        <Text className="text-white/85 text-subhead mb-4">Overview of your invoices</Text>
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
            <Text className="text-subhead text-secondary">Paid This Month</Text>
            <Text className="text-title1 font-bold text-label">
              {formatMinor(receivedThisMonth, currencyCode)}
            </Text>
          </View>
          <Text className="text-subhead text-secondary mt-1">Last 6 Months</Text>
        </View>
        <LineChart
          data={revenueByMonth}
          accessibilityLabel={describeSeries('Paid by month', revenueByMonth, currencyCode)}
        />
      </Card>

      <Card>
        <View className="gap-3 mb-3">
          <Text className="text-body font-semibold text-label" accessibilityRole="header">
            Paid by Period
          </Text>
          <View>
            <SegmentedControl
              values={GRANULARITIES.map((g) => g.label)}
              selectedIndex={GRANULARITIES.findIndex((g) => g.value === granularity)}
              tintColor={BRAND.default}
              activeFontStyle={{ color: '#FFFFFF' }}
              onChange={(e) => setGranularity(GRANULARITIES[e.nativeEvent.selectedSegmentIndex].value)}
            />
          </View>
        </View>
        <BarChart
          data={paidByPeriod}
          accessibilityLabel={describeSeries(`Paid by ${granularity}`, paidByPeriod, currencyCode)}
        />
      </Card>
    </ScrollView>
  );
}
