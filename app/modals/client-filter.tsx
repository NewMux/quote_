import { Pressable, Switch, Text, View } from 'react-native';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useClientsStore } from '../../src/stores/useClientsStore';

const SORT_OPTIONS: Array<{ label: string; value: 'name' | 'recent' }> = [
  { label: 'Name A-Z', value: 'name' },
  { label: 'Recently Added', value: 'recent' },
];

/** Every control here commits straight to useClientsStore's live filter, matching the
 * Documents filter sheet's pattern, so "Done" (not "Cancel") is the right label. */
export default function ClientFilterModal() {
  const { sortBy, setSortBy, hasBalanceOnly, setHasBalanceOnly } = useClientsStore();

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title="Filter Clients" closeLabel="Done" />
      <View className="p-4 gap-6">
        <View>
          <Text className="text-xs text-gray-500 mb-2">Sort By</Text>
          <View className="flex-row flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => {
              const selected = sortBy === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSortBy(opt.value)}
                  className={`px-3 py-2 rounded-full border ${
                    selected ? 'bg-brand border-brand' : 'border-gray-300'
                  }`}
                >
                  <Text className={selected ? 'text-white text-sm' : 'text-gray-700 text-sm'}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-white rounded-lg border border-gray-300 px-3 py-3">
          <Text className="text-base text-gray-900">With outstanding balance only</Text>
          <Switch value={hasBalanceOnly} onValueChange={setHasBalanceOnly} />
        </View>
      </View>
    </View>
  );
}
