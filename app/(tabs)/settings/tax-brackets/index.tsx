import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '../../../../src/components/Button';
import { EmptyState } from '../../../../src/components/EmptyState';
import { formatRateBp } from '../../../../src/lib/money';
import { useTaxBracketsStore } from '../../../../src/stores/useTaxBracketsStore';

export default function TaxBracketsScreen() {
  const { taxBrackets, load, setDefault } = useTaxBracketsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-grouped">
      <FlatList
        data={taxBrackets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="No tax rates yet" subtitle="Add one to apply to your line items." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/settings/tax-brackets/${item.id}/edit`)}>
            <View className="bg-card rounded-xl p-4 mb-3 border border-separator flex-row justify-between items-center">
              <View>
                <Text className="text-base font-semibold text-label">{item.name}</Text>
                <Text className="text-sm text-secondary">{formatRateBp(item.rate_bp)}</Text>
              </View>
              {item.is_default ? (
                <Text className="text-xs text-tint font-semibold">Default</Text>
              ) : (
                <Button label="Set default" variant="plain" size="small" onPress={() => setDefault(item.id)} />
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
