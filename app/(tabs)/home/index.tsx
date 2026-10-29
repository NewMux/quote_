import { useCallback, useLayoutEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BarChart } from '../../../src/components/charts/BarChart';
import { LineChart } from '../../../src/components/charts/LineChart';
import { GroupedCard } from '../../../src/components/GroupedCard';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { Icon } from '../../../src/components/Icon';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { listDocuments } from '../../../src/db/repositories/documents.repo';
import { formatDisplayDate } from '../../../src/lib/format';
import { formatMinor } from '../../../src/lib/money';
import { formatPeriodLabel, type ReportPeriod } from '../../../src/lib/reportPeriods';
import { newDocumentMenuItem, showNewDocumentChooser } from '../../../src/lib/headerItems';
import type { SymbolName } from '../../../src/lib/symbols';
import { useSystemColors } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useDocumentsStore } from '../../../src/stores/useDocumentsStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { ReportGranularity } from '../../../src/db/repositories/reports.repo';
import type { DocumentListItem } from '../../../src/types/models';
import { t, tp } from '../../../src/lib/i18n';

const GRANULARITIES: { label: string; value: ReportGranularity }[] = [
  { label: t('Day'), value: 'day' },
  { label: t('Week'), value: 'week' },
  { label: t('Month'), value: 'month' },
  { label: t('Year'), value: 'year' },
];

const PERIODS: { label: string; kind: ReportPeriod['kind'] }[] = [
  { label: t('Month'), kind: 'month' },
  { label: t('90 Days'), kind: 'last90' },
  { label: t('Year'), kind: 'year' },
  { label: t('Custom'), kind: 'custom' },
];

const ATTENTION_LIMIT = 3;

/** "Paid by month: Apr, $1,200; May, $0; …" — the spoken equivalent of a chart. */
function describeSeries(title: string, data: { label: string; value: number }[], currencyCode: string) {
  if (data.length === 0) return t('{title}: no data yet', { title });
  return `${title}: ${data.map((d) => `${d.label}, ${formatMinor(d.value, currencyCode)}`).join('; ')}`;
}

function invoiceCount(count: number) {
  return tp(count, '{count} invoice', '{count} invoices');
}

function documentCount(count: number) {
  return tp(count, '{count} document', '{count} documents');
}

interface TileProps {
  symbol: SymbolName;
  color: string;
  label: string;
  amount: string;
  detail: string;
}

/** A Health-style summary tile: a colored SF Symbol and label, then the figure. */
function SummaryTile({ symbol, color, label, amount, detail }: TileProps) {
  return (
    <View
      className="flex-1 bg-card p-4 gap-2"
      style={{ borderRadius: 22, borderCurve: 'continuous' }}
      accessible
      accessibilityLabel={t('{label}: {amount}, {detail}', { label, amount, detail })}
    >
      <View className="flex-row items-center gap-1.5">
        <Icon name={symbol} size={17} color={color} weight="semibold" />
        <Text className="text-subhead font-semibold text-secondary">{label}</Text>
      </View>
      <View>
        <Text className="text-title2 font-bold text-label" numberOfLines={1} adjustsFontSizeToFit>
          {amount}
        </Text>
        <Text className="text-footnote text-secondary">{detail}</Text>
      </View>
    </View>
  );
}

export default function SummaryScreen() {
  const navigation = useNavigation();
  const system = useSystemColors();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overdue, setOverdue] = useState<DocumentListItem[]>([]);
  // "Custom" opens a sheet rather than selecting immediately; remounting the control afterwards puts
  // the highlight back on the period that's actually in effect if the sheet is cancelled.
  const [periodControlKey, setPeriodControlKey] = useState(0);
  const currencyCode = useBusinessProfileStore((s) => s.profile?.default_currency_code ?? 'USD');
  const setDocumentsFilter = useDocumentsStore((s) => s.setFilter);
  const { breakdown, revenueByMonth, paidByPeriod, granularity, period, load, setGranularity, setPeriod } =
    useReportsStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [newDocumentMenuItem()],
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => <HeaderButton icon="plus" label={t('New Document')} onPress={showNewDocumentChooser} />,
    });
  }, [navigation]);

  const loadAll = useCallback(async () => {
    const [, overdueDocs] = await Promise.all([
      load(),
      listDocuments({ docType: 'invoice', status: 'overdue' }).catch(() => []),
    ]);
    setOverdue(overdueDocs);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadAll();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handlePeriodChange(index: number) {
    const kind = PERIODS[index].kind;
    if (kind === 'custom') {
      setPeriodControlKey((k) => k + 1);
      router.push('/modals/custom-range');
      return;
    }
    setPeriod({ kind } as ReportPeriod);
  }

  function showAllOverdue() {
    setDocumentsFilter({ status: 'overdue', docType: 'invoice' });
    router.navigate('/(tabs)/documents');
  }

  const outstandingMinor = breakdown.unpaidMinor + breakdown.overdueMinor;
  const outstandingCount = breakdown.unpaidCount + breakdown.overdueCount;
  const paidThisMonth = revenueByMonth[revenueByMonth.length - 1]?.value ?? 0;
  const selectedPeriodIndex = PERIODS.findIndex((p) => p.kind === period.kind);

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingTop: 8 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <SegmentedControl
        key={periodControlKey}
        values={PERIODS.map((p) => p.label)}
        selectedIndex={selectedPeriodIndex}
        onChange={(e) => handlePeriodChange(e.nativeEvent.selectedSegmentIndex)}
      />
      {period.kind === 'custom' ? (
        <Pressable
          onPress={() => router.push('/modals/custom-range')}
          accessibilityRole="button"
          accessibilityHint={t('Change the date range')}
          className="min-h-[44px] justify-center items-center"
        >
          <Text className="text-subhead text-tint">{formatPeriodLabel(period)}</Text>
        </Pressable>
      ) : null}

      {/* The one figure that matters most, set in the large title style, like Wallet's balance. */}
      <View className="px-1 pt-6 pb-5" accessible accessibilityLabel={t('Outstanding: {amount}', { amount: formatMinor(outstandingMinor, currencyCode) })}>
        <Text className="text-subhead font-semibold text-secondary">{t('Outstanding')}</Text>
        <Text className="text-largetitle font-bold text-label" numberOfLines={1} adjustsFontSizeToFit>
          {formatMinor(outstandingMinor, currencyCode)}
        </Text>
        <Text className="text-subhead text-secondary">
          {t('{count} awaiting payment', { count: invoiceCount(outstandingCount) })} · {formatPeriodLabel(period)}
        </Text>
      </View>

      <View className="gap-3 mb-8">
        <View className="flex-row gap-3">
          <SummaryTile
            symbol="checkmark.circle.fill"
            color={system.green}
            label={t('Paid')}
            amount={formatMinor(breakdown.paidMinor, currencyCode)}
            detail={invoiceCount(breakdown.paidCount)}
          />
          <SummaryTile
            symbol="clock.fill"
            color={system.orange}
            label={t('Unpaid')}
            amount={formatMinor(breakdown.unpaidMinor, currencyCode)}
            detail={invoiceCount(breakdown.unpaidCount)}
          />
        </View>
        <View className="flex-row gap-3">
          <SummaryTile
            symbol="exclamationmark.circle.fill"
            color={system.red}
            label={t('Overdue')}
            amount={formatMinor(breakdown.overdueMinor, currencyCode)}
            detail={invoiceCount(breakdown.overdueCount)}
          />
          <SummaryTile
            symbol="pencil.circle.fill"
            color={system.gray}
            label={t('Drafts')}
            amount={formatMinor(breakdown.draftMinor, currencyCode)}
            detail={documentCount(breakdown.draftCount)}
          />
        </View>
      </View>

      {overdue.length > 0 ? (
        <ListSection header={t('Needs Attention')} footer={t('Overdue invoices, oldest due date first.')}>
          {[
            ...[...overdue]
              .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
              .slice(0, ATTENTION_LIMIT)
              .map((doc) => (
                <ListRow
                  key={doc.id}
                  icon="exclamationmark.circle.fill"
                  iconColor={system.red}
                  title={doc.client_name ?? t('No Client')}
                  subtitle={doc.due_date ? t('{number} · Due {date}', { number: doc.doc_number, date: formatDisplayDate(doc.due_date) }) : doc.doc_number}
                  value={formatMinor(doc.total_minor - doc.amount_paid_minor, doc.currency_code)}
                  valueClassName="text-destructive font-semibold"
                  onPress={() => router.push(`/documents/${doc.id}`)}
                />
              )),
            ...(overdue.length > ATTENTION_LIMIT
              ? [<ListRow key="all" title={t('Show All {count}', { count: overdue.length })} centered onPress={showAllOverdue} />]
              : []),
          ]}
        </ListSection>
      ) : null}

      <GroupedCard header={t('Payments')}>
        <View className="flex-row justify-between items-end mb-3">
          <View>
            <Text className="text-subhead text-secondary">{t('Paid This Month')}</Text>
            <Text className="text-title1 font-bold text-label">{formatMinor(paidThisMonth, currencyCode)}</Text>
          </View>
          <Text className="text-footnote text-secondary mb-1">{t('Last 6 Months')}</Text>
        </View>
        <LineChart
          data={revenueByMonth}
          accessibilityLabel={describeSeries(t('Paid by month'), revenueByMonth, currencyCode)}
        />
      </GroupedCard>

      <GroupedCard header={t('Paid by Period')}>
        <View className="mb-4">
          <SegmentedControl
            values={GRANULARITIES.map((g) => g.label)}
            selectedIndex={GRANULARITIES.findIndex((g) => g.value === granularity)}
            onChange={(e) => setGranularity(GRANULARITIES[e.nativeEvent.selectedSegmentIndex].value)}
          />
        </View>
        <BarChart
          data={paidByPeriod}
          accessibilityLabel={describeSeries(t('Paid by {period}', { period: GRANULARITIES.find((g) => g.value === granularity)?.label.toLowerCase() ?? granularity }), paidByPeriod, currencyCode)}
        />
      </GroupedCard>
    </ScrollView>
  );
}
