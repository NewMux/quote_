import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import type { FormState } from '../../src/components/form/useFormState';
import { ItemForm } from '../../src/components/ItemForm';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SheetScreen } from '../../src/components/SheetScreen';
import { useUnsavedChangesGuard } from '../../src/lib/useUnsavedChangesGuard';
import { useItemCatalogStore } from '../../src/stores/useItemCatalogStore';
import type { ItemInput } from '../../src/db/repositories/itemCatalog.repo';

export default function NewItemScreen() {
  const create = useItemCatalogStore((s) => s.create);
  const [form, setForm] = useState<FormState<ItemInput> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const leave = useUnsavedChangesGuard(!!form?.isDirty && !isSaving);

  async function handleAdd() {
    if (!form?.canSubmit) return;
    setIsSaving(true);
    try {
      await create(form.value);
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Add Item', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <SheetScreen
      header={<SheetHeader title="New Item" actionLabel="Add" onAction={handleAdd} actionDisabled={!form?.canSubmit || isSaving} />}
    >
      <ItemForm onStateChange={setForm} />
    </SheetScreen>
  );
}
