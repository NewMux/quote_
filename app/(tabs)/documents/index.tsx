import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EmptyState } from '../../../src/components/EmptyState';
import { HeaderButton } from '../../../src/components/HeaderButton';
import { Icon } from '../../../src/components/Icon';
import { GroupedRow } from '../../../src/components/list/GroupedRow';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { SwipeAction } from '../../../src/components/SwipeAction';
import { convertEstimateToInvoice, deleteDocument } from '../../../src/db/repositories/documents.repo';
import { docTypeLabel, formatShortDate } from '../../../src/lib/format';
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
import { SWIPE_COLORS } from '../../../src/lib/theme';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { useDocumentsStore } from '../../../src/stores/useDocumentsStore';
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
                  icon={hasActiveFilter ? 'line.3.horizontal.decrease.circle.fill' : 'line.3.horizontal.decrease.circle'}
                  label="Filter"
                  selected={hasActiveFilter}
                  onPress={openFilters}
                />
                <HeaderButton icon="plus" label="New Document" onPress={showNewDocumentChooser} />
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

  async function handleShare(item: DocumentListItem, swipeable?: SwipeableMethods) {
    swipeable?.close();
    try {
      const pdfUri = await generateDocumentPdf(item.id);
      await sharePdf(item.id, pdfUri);
    } catch (err) {
      Alert.alert('Couldn’t Share', err instanceof Error ? err.message : 'Something went wrong.');
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
            } catch (err) {
              Alert.alert('Couldn’t Delete', err instanceof Error ? err.message : 'Something went wrong.');
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
      router.push(`/documents/${invoice.id}`);
    } catch (err) {
      Alert.alert('Couldn’t Convert', err instanceof Error ? err.message : 'Something went wrong.');
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
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      ListHeaderComponent={
        <View className="gap-2 mb-4">
          <SegmentedControl
            values={TYPE_FILTERS.map((f) => f.label)}
            selectedIndex={activeTypeIndex}
            onChange={(e) =>
              setFilter({ ...filter, docType: TYPE_FILTERS[e.nativeEvent.selectedSegmentIndex].value })
            }
          />

          {hasActiveFilter ? (
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-footnote text-secondary">
                {documents.length} {documents.length === 1 ? 'result' : 'results'} · Filtered
              </Text>
              <Pressable
                onPress={clearFilters}
                accessibilityRole="button"
                hitSlop={8}
                className="min-h-[44px] justify-center"
              >
                <Text className="text-subhead text-tint">Clear Filters</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isNarrowed ? (
          <EmptyState icon="magnifyingglass" title="No Results" subtitle="Try a different search or filter." />
        ) : (
          <EmptyState
            icon="doc.text"
            title="No Documents"
            subtitle="Estimates and invoices you create appear here."
            actionLabel="New Invoice"
            onAction={() => startNewDocument('invoice')}
          />
        )
      }
      renderItem={({ item, index }) => {
        const status = statusLabel(getDisplayStatus(item));
        const client = item.client_name ?? 'No Client';
        const total = formatMinor(item.total_minor, item.currency_code);
        const date = formatShortDate(item.issue_date ?? item.created_at);
        const actions = [
          { name: 'share', label: 'Share PDF', run: () => handleShare(item) },
          ...(canConvertToInvoice(item) ? [{ name: 'convert', label: 'Convert to Invoice', run: () => handleConvert(item) }] : []),
          ...(canLogSettlement(item) ? [{ name: 'payment', label: 'Log Payment', run: () => handleLogPayment(item) }] : []),
          ...(canDelete(item) ? [{ name: 'delete', label: 'Delete', run: () => handleDelete(item) }] : []),
        ];
        return (
          <GroupedRow index={index} count={documents.length}>
            <Swipeable
              renderRightActions={(_progress, _translation, swipeable) => (
                <View className="flex-row">
                  <SwipeAction
                    label="Share"
                    icon="square.and.arrow.up"
                    color={SWIPE_COLORS.share}
                    onPress={() => handleShare(item, swipeable)}
                  />
                  {canConvertToInvoice(item) ? (
                    <SwipeAction
                      label="Convert"
                      icon="arrow.left.arrow.right"
                      color={SWIPE_COLORS.convert}
                      onPress={() => handleConvert(item, swipeable)}
                    />
                  ) : null}
                  {canLogSettlement(item) ? (
                    <SwipeAction
                      label="Payment"
                      icon="banknote"
                      color={SWIPE_COLORS.payment}
                      onPress={() => handleLogPayment(item, swipeable)}
                    />
                  ) : null}
                  {canDelete(item) ? (
                    <SwipeAction
                      label="Delete"
                      icon="trash"
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
                  <View className={pressed ? 'bg-fill' : 'bg-card'}>
                    {index > 0 ? <View style={{ marginLeft: 64, height: 0.5 }} className="bg-separator" /> : null}
                    <View className="flex-row items-center gap-3 px-4 py-3">
                      <View
                        className="w-9 h-9 rounded-[10px] bg-secondaryfill items-center justify-center"
                        style={{ borderCurve: 'continuous' }}
                      >
                        <Icon name={item.doc_type === 'invoice' ? 'doc.text.fill' : 'doc.plaintext.fill'} size={18} />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <View className="flex-row items-baseline gap-2">
                          <Text className="flex-1 text-body font-semibold text-label" numberOfLines={1}>
                            {client}
                          </Text>
                          <Text className="text-body text-label" numberOfLines={1}>
                            {total}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-1 text-subhead text-secondary" numberOfLines={1}>
                            {item.doc_number}
                            {` · ${date}`}
                          </Text>
                          <StatusBadge document={item} variant="inline" />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </Swipeable>
          </GroupedRow>
        );
      }}
    />
  );
}
