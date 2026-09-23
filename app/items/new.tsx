import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ItemForm } from '../../src/components/ItemForm';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useItemCatalogStore } from '../../src/stores/useItemCatalogStore';
import type { ItemInput } from '../../src/db/repositories/itemCatalog.repo';

export default function NewItemScreen() {
  const create = useItemCatalogStore((s) => s.create);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(input: ItemInput) {
    setIsSaving(true);
    await create(input);
    setIsSaving(false);
    router.back();
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="New Item" />
      <ItemForm onSubmit={handleSubmit} isSaving={isSaving} />
    </View>
  );
}
