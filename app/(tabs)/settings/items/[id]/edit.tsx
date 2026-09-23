import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { FormState } from '../../../../../src/components/form/useFormState';
import { ItemForm } from '../../../../../src/components/ItemForm';
import { ListRow } from '../../../../../src/components/list/ListRow';
import { ListSection } from '../../../../../src/components/list/ListSection';
import { getItem, type ItemInput } from '../../../../../src/db/repositories/itemCatalog.repo';
import { useSaveHeader } from '../../../../../src/lib/useSaveHeader';
import { useUnsavedChangesGuard } from '../../../../../src/lib/useUnsavedChangesGuard';
import { useItemCatalogStore } from '../../../../../src/stores/useItemCatalogStore';
import type { ItemCatalogEntry } from '../../../../../src/types/models';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { update, archive } = useItemCatalogStore();
  const [item, setItem] = useState<ItemCatalogEntry | null>(null);
  const [form, setForm] = useState<FormState<ItemInput> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const leave = useUnsavedChangesGuard(!!form?.isDirty && !isSaving);

  useEffect(() => {
    getItem(id).then(setItem);
  }, [id]);

  async function handleSave() {
    if (!form?.canSubmit) return;
    setIsSaving(true);
    try {
      await update(id, form.value);
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Item', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  useSaveHeader({ onSave: handleSave, disabled: !form?.canSubmit || !form.isDirty || isSaving });

  function confirmArchive() {
    Alert.alert(`Archive ${item?.name ?? 'Item'}?`, "It won't appear in your item catalog anymore.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archive(id, true);
          leave(() => router.back());
        },
      },
    ]);
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <ItemForm
      initial={item}
      onStateChange={setForm}
      footer={
        <ListSection>
          <ListRow title="Archive Item" onPress={confirmArchive} destructive centered />
        </ListSection>
      }
    />
  );
}
