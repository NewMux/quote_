import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { StatStrip } from '../../../src/components/StatStrip';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { SwipeAction } from '../../../src/components/SwipeAction';
import { convertEstimateToInvoice, deleteDocument } from '../../../src/db/repositories/documents.repo';
import { docTypeLabel } from '../../../src/lib/format';
import {
  filterButtonItem,
  newDocumentMenuItem,
  showNewDocumentChooser,
  startNewDocument,
} from '../../../src/lib/headerItems';
import { generateDocumentPdf } from '../../../src/lib/pdf/generatePdf';
import { sharePdf } from '../../../src/lib/share';
import { formatMinor } from '../../../src/lib/money';
import { canConvertToInvoice, canDelete, canLogSettlement, getDisplayStatus, statusLabel } from '../../../src/lib/statusMachine';
import { BRAND, SWIPE_COLORS } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useDocumentsStore } from '../../../src/stores/useDocumentsStore';
import { useReportsStore } from '../../../src/stores/useReportsStore';
import type { DocType, DocumentListItem } from '../../../src/types/models';

const TYPE_FILTERS: { label: string; value: DocType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Estimates', value: 'estimate' },
  { label: 'Invoices', value: 'invoice' },
];

function openFilters() {
  router.push('/modals/document-filter');
}

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const { documents, filter, setFilter, load } = useDocumentsStore();
  const { breakdown, load: loadReports } = useReportsStore();
  const profile = useBusinessProfileStore((s) => s.profile);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasActiveFilter = !!(filter.status || filter.clientId || filter.dateFrom || filter.dateTo);
  const isNarrowed = hasActiveFilter || !!filter.search || !!filter.docType;
  const activeTypeIndex = Math.max(
    TYPE_FILTERS.findIndex((f) => f.value === filter.docType),
    0
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [newDocumentMenuItem(), filterButtonItem(hasActiveFilter, openFilters)],
      headerRight:
        Platform.OS === 'ios'
          ? undefined
          : () => (
              <View className="flex-row">
                <HeaderButton
                  icon={hasActiveFilter ? 'filter-circle' : 'filter-circle-outline'}
                  label="Filter"
                  selected={hasActiveFilter}
                  onPress={openFilters}
                />
                <HeaderButton icon="add" label="New Document" onPress={showNewDocumentChooser} />
              </View>
            ),
      headerSearchBarOptions: {
        placeholder: 'Search Documents',
        autoCapitalize: 'none',
        onChangeText: (event: { nativeEvent: { text: string } }) => {
          const current = useDocumentsStore.getState().filter;
          const text = event.nativeEvent.text;
          setFilter({ ...current, search: text || undefined });
        },
      },
    });
  }, [navigation, hasActiveFilter, setFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadReports();
    }, [load, loadReports])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([load(), loadReports()]);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleShare(item: DocumentListItem, swipeable?: SwipeableMethods) {
    swipeable?.close();
    try {
      const pdfUri = await generateDocumentPdf(item.id);
      await sharePdf(item.id, pdfUri);
    } catch (err) {
      Alert.alert('Could Not Share', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleDelete(item: DocumentListItem, swipeable?: SwipeableMethods) {
    swipeable?.close();
    Alert.alert(
      `Delete ${item.doc_number}?`,
      "This permanently deletes the document with its line items, signatures, and payment records. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(item.id);
              load();
              loadReports();
            } catch (err) {
              Alert.alert('Could Not Delete', err instanceof Error ? err.message : 'Something went wrong.');
            }
          },
        },
      ]
    );
  }

  async function handleConvert(item: DocumentListItem, swipeable?: SwipeableMethods) {
    swipeable?.close();
    if (!profile) return;
    try {
      const invoice = await convertEstimateToInvoice(item.id, profile);
      load();
      loadReports();
      router.push(`/documents/${invoice.id}`);
    } catch (err) {
      Alert.alert('Could Not Convert', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleLogPayment(item: DocumentListItem, swipeable?: SwipeableMethods) {
    swipeable?.close();
    router.push(`/documents/${item.id}/settlement-new`);
  }

  function clearFilters() {
    setFilter({ ...filter, status: undefined, clientId: undefined, dateFrom: undefined, dateTo: undefined });
  }

  return (
    <FlatList
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
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

          <SegmentedControl
            values={TYPE_FILTERS.map((f) => f.label)}
            selectedIndex={activeTypeIndex}
            tintColor={BRAND.default}
            activeFontStyle={{ color: '#FFFFFF' }}
            onChange={(e) =>
              setFilter({ ...filter, docType: TYPE_FILTERS[e.nativeEvent.selectedSegmentIndex].value })
            }
          />

          {hasActiveFilter ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-secondary">Filters are on</Text>
              <Pressable
                onPress={clearFilters}
                accessibilityRole="button"
                hitSlop={8}
                className="min-h-[44px] justify-center"
              >
                <Text className="text-base text-tint font-medium">Clear Filters</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isNarrowed ? (
          <EmptyState icon="search" title="No Results" subtitle="Try a different search or filter." />
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No Documents Yet"
            subtitle="Create your first estimate or invoice to get started."
            actionLabel="New Invoice"
            onAction={() => startNewDocument('invoice')}
          />
        )
      }
      renderItem={({ item }) => {
        const status = statusLabel(getDisplayStatus(item));
        const client = item.client_name ?? 'No Client';
        const total = formatMinor(item.total_minor, item.currency_code);
        const actions = [
          { name: 'share', label: 'Share PDF', run: () => handleShare(item) },
          ...(canConvertToInvoice(item) ? [{ name: 'convert', label: 'Convert to Invoice', run: () => handleConvert(item) }] : []),
          ...(canLogSettlement(item) ? [{ name: 'payment', label: 'Log Payment', run: () => handleLogPayment(item) }] : []),
          ...(canDelete(item) ? [{ name: 'delete', label: 'Delete', run: () => handleDelete(item) }] : []),
        ];
        return (
          <Swipeable
            containerStyle={{ borderRadius: 24, overflow: 'hidden' }}
            renderRightActions={(_progress, _translation, swipeable) => (
              <View className="flex-row">
                <SwipeAction
                  label="Share"
                  icon="share-outline"
                  color={SWIPE_COLORS.share}
                  onPress={() => handleShare(item, swipeable)}
                />
                {canConvertToInvoice(item) ? (
                  <SwipeAction
                    label="Convert"
                    icon="swap-horizontal-outline"
                    color={SWIPE_COLORS.convert}
                    onPress={() => handleConvert(item, swipeable)}
                  />
                ) : null}
                {canLogSettlement(item) ? (
                  <SwipeAction
                    label="Payment"
                    icon="cash-outline"
                    color={SWIPE_COLORS.payment}
                    onPress={() => handleLogPayment(item, swipeable)}
                  />
                ) : null}
                {canDelete(item) ? (
                  <SwipeAction
                    label="Delete"
                    icon="trash-outline"
                    color={SWIPE_COLORS.delete}
                    onPress={() => handleDelete(item, swipeable)}
                  />
                ) : null}
              </View>
            )}
          >
            <Pressable
              onPress={() => router.push(`/documents/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${docTypeLabel(item.doc_type)} ${item.doc_number}, ${client}, ${status}, ${total}`}
              accessibilityActions={actions.map((a) => ({ name: a.name, label: a.label }))}
              onAccessibilityAction={(e) => actions.find((a) => a.name === e.nativeEvent.actionName)?.run()}
            >
              {({ pressed }) => (
                <Card className={`p-4 ${pressed ? 'opacity-70' : ''}`}>
                  <View className="flex-row items-center gap-3">
                    <Avatar name={client} seed={item.client_id ?? item.id} size={40} />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-label" numberOfLines={1}>
                        {item.doc_number}
                      </Text>
                      <Text className="text-sm text-secondary" numberOfLines={1}>
                        {client}
                      </Text>
                    </View>
                    <StatusBadge document={item} />
                  </View>
                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-separator">
                    <Text className="text-sm text-secondary">{docTypeLabel(item.doc_type)}</Text>
                    <Text className="text-base font-semibold text-label" numberOfLines={1}>
                      {total}
                    </Text>
                  </View>
                </Card>
              )}
            </Pressable>
          </Swipeable>
        );
      }}
    />
  );
}
