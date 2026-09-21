import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ItemForm } from '../../../src/components/ItemForm';
import { getItem, type ItemInput } from '../../../src/db/repositories/itemCatalog.repo';
import { useItemCatalogStore } from '../../../src/stores/useItemCatalogStore';
import type { ItemCatalogEntry } from '../../../src/types/models';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { update, archive } = useItemCatalogStore();
  const [item, setItem] = useState<ItemCatalogEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getItem(id).then(setItem);
  }, [id]);

  useEffect(() => {
    navigation.setOptions({
      title: item ? `Edit ${item.name}` : 'Edit Item',
      headerRight: () => (
        <Pressable onPress={confirmArchive}>
          <Text className="text-red-500">Archive</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, id, item]);

  function confirmArchive() {
    Alert.alert('Archive item?', 'It will no longer appear in the item catalog.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archive(id, true);
          router.back();
        },
      },
    ]);
  }

  async function handleSubmit(input: ItemInput) {
    setIsSaving(true);
    await update(id, input);
    setIsSaving(false);
    router.back();
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return <ItemForm initial={item} onSubmit={handleSubmit} isSaving={isSaving} />;
}
