import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { StatStrip } from '../../../src/components/StatStrip';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { formatMinor } from '../../../src/lib/money';
import { BRAND } from '../../../src/lib/theme';
import { useDocumentsStore } from '../../../src/stores/useDocumentsStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { DocType } from '../../../src/types/models';

const TYPE_FILTERS: Array<{ label: string; value: DocType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Estimates', value: 'estimate' },
  { label: 'Invoices', value: 'invoice' },
];

export default function DocumentsScreen() {
  const { documents, filter, setFilter, load } = useDocumentsStore();
  const { breakdown, load: loadReports } = useReportsStore();
  const [activeTypeIndex, setActiveTypeIndex] = useState(0);
  const [search, setSearch] = useState('');
  const hasActiveFilter = !!(filter.status || filter.clientId || filter.dateFrom || filter.dateTo);

  useFocusEffect(
    useCallback(() => {
      load();
      loadReports();
    }, [load, loadReports])
  );

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Documents" />
      <FlatList
        style={{ flex: 1 }}
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 16, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4 mb-2">
            <StatStrip
              items={[
                { label: 'Paid', value: String(breakdown.paidCount) },
                { label: 'Unpaid', value: String(breakdown.unpaidCount) },
                { label: 'Overdue', value: String(breakdown.overdueCount) },
                { label: 'Draft', value: String(breakdown.draftCount) },
              ]}
            />

            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center bg-white rounded-2xl px-3 border border-gray-200">
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  className="flex-1 py-2.5 px-2 text-base text-gray-900"
                  placeholder="Search documents…"
                  value={search}
                  onChangeText={(text) => {
                    setSearch(text);
                    setFilter({ ...filter, search: text || undefined });
                  }}
                />
              </View>
              <Pressable
                onPress={() => router.push('/modals/document-filter')}
                accessibilityLabel="Filter documents"
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  hasActiveFilter ? 'bg-brand' : 'bg-white border border-gray-200'
                }`}
              >
                <Ionicons name="options-outline" size={20} color={hasActiveFilter ? 'white' : '#374151'} />
              </Pressable>
            </View>

            {hasActiveFilter ? (
              <Pressable
                onPress={() => setFilter({ ...filter, status: undefined, clientId: undefined, dateFrom: undefined, dateTo: undefined })}
              >
                <Text className="text-brand text-sm font-medium">Clear filters</Text>
              </Pressable>
            ) : null}

            <SegmentedControl
              values={TYPE_FILTERS.map((f) => f.label)}
              selectedIndex={activeTypeIndex}
              tintColor={BRAND.default}
              onChange={(e) => {
                const index = e.nativeEvent.selectedSegmentIndex;
                setActiveTypeIndex(index);
                setFilter({ ...filter, docType: TYPE_FILTERS[index].value });
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No documents yet"
            subtitle="Tap the + button to create your first estimate or invoice."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/documents/${item.id}`)}>
            <Card className="p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name={item.client_name ?? 'No client'} seed={item.client_id ?? item.id} size={40} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                    {item.doc_number}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {item.client_name ?? 'No client'}
                  </Text>
                </View>
                <StatusBadge document={item} />
              </View>
              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-500 uppercase">{item.doc_type}</Text>
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {formatMinor(item.total_minor, item.currency_code)}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push('/documents/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
