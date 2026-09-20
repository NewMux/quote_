import { useState } from 'react';
import { router } from 'expo-router';
import { ItemForm } from '../../src/components/ItemForm';
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

  return <ItemForm onSubmit={handleSubmit} isSaving={isSaving} />;
}
