import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../src/components/EmptyState';
import { StatusBadge } from '../../src/components/StatusBadge';
import { formatMinor } from '../../src/lib/money';
import { useDocumentsStore } from '../../src/stores/useDocumentsStore';
import type { DocType } from '../../src/types/models';

const TYPE_FILTERS: Array<{ label: string; value: DocType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Estimates', value: 'estimate' },
  { label: 'Invoices', value: 'invoice' },
];

export default function DocumentsScreen() {
  const { documents, filter, setFilter, load } = useDocumentsStore();
  const [activeType, setActiveType] = useState<DocType | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row gap-2 px-4 pt-4 pb-2">
        {TYPE_FILTERS.map((f) => {
          const selected = f.value === activeType;
          return (
            <Pressable
              key={f.label}
              onPress={() => {
                setActiveType(f.value);
                setFilter({ ...filter, docType: f.value });
              }}
              className={`px-3 py-1.5 rounded-full border ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
            >
              <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={
          <EmptyState
            title="No documents yet"
            subtitle="Tap the + button to create your first estimate or invoice."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/documents/${item.id}`)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-base font-semibold text-gray-900">{item.doc_number}</Text>
                <Text className="text-sm text-gray-500">{item.client_name ?? 'No client'}</Text>
              </View>
              <StatusBadge document={item} />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-gray-400 uppercase">{item.doc_type}</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatMinor(item.total_minor, item.currency_code)}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push('/documents/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
