import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from '../../src/components/charts/BarChart';
import { LineChart } from '../../src/components/charts/LineChart';
import { Card } from '../../src/components/Card';
import { StatStrip } from '../../src/components/StatStrip';
import { formatMinor } from '../../src/lib/money';
import { BRAND } from '../../src/lib/theme';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import { useReportsStore } from '../../src/stores/useReportsStore';
import type { ReportGranularity } from '../../src/db/repositories/reports.repo';

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
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View style={{ backgroundColor: BRAND.mint }} className="w-1.5 h-5 rounded-full" />
          <View style={{ backgroundColor: BRAND.default }} className="w-1.5 h-5 rounded-full -ml-1" />
          <Text className="text-lg font-bold text-gray-900 ml-1">Quote</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="settings-outline" size={22} color="#374151" />
        </Pressable>
      </View>

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
          <View className="flex-row gap-1">
            {GRANULARITIES.map((g) => {
              const selected = g.value === granularity;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => setGranularity(g.value)}
                  className={`w-7 h-7 rounded-full items-center justify-center ${selected ? 'bg-brand' : 'bg-gray-100'}`}
                >
                  <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-gray-600'}`}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <BarChart data={paidByPeriod} />
      </Card>
    </ScrollView>
  );
}
