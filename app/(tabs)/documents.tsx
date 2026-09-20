import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/Avatar';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { StatStrip } from '../../src/components/StatStrip';
import { StatusBadge } from '../../src/components/StatusBadge';
import { formatMinor } from '../../src/lib/money';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';
import { useReportsStore } from '../../src/stores/useReportsStore';
import type { DocType } from '../../src/types/models';

const TYPE_FILTERS: Array<{ label: string; value: DocType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Estimates', value: 'estimate' },
  { label: 'Invoices', value: 'invoice' },
];

export default function DocumentsScreen() {
  const { documents, filter, setFilter, load } = useDocumentsStore();
  const { breakdown, load: loadReports } = useReportsStore();
  const [activeType, setActiveType] = useState<DocType | undefined>(undefined);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
      loadReports();
    }, [load, loadReports])
  );

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4 mb-2">
            {breakdown ? (
              <StatStrip
                items={[
                  { label: 'Paid', value: String(breakdown.paidCount) },
                  { label: 'Unpaid', value: String(breakdown.unpaidCount) },
                  { label: 'Overdue', value: String(breakdown.overdueCount) },
                  { label: 'Draft', value: String(breakdown.draftCount) },
                ]}
              />
            ) : null}

            <View className="flex-row items-center bg-white rounded-2xl px-3 border border-gray-200">
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

            <View className="flex-row gap-2">
              {TYPE_FILTERS.map((f) => {
                const selected = f.value === activeType;
                return (
                  <Pressable
                    key={f.label}
                    onPress={() => {
                      setActiveType(f.value);
                      setFilter({ ...filter, docType: f.value });
                    }}
                    className={`px-3 py-1.5 rounded-full border ${selected ? 'bg-brand border-brand' : 'border-gray-300'}`}
                  >
                    <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
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
                  <Text className="text-base font-semibold text-gray-900">{item.doc_number}</Text>
                  <Text className="text-sm text-gray-500">{item.client_name ?? 'No client'}</Text>
                </View>
                <StatusBadge document={item} />
              </View>
              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-400 uppercase">{item.doc_type}</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {formatMinor(item.total_minor, item.currency_code)}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
