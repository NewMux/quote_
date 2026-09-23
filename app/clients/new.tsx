import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { ClientForm } from '../../src/components/ClientForm';
import type { FormState } from '../../src/components/form/useFormState';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useUnsavedChangesGuard } from '../../src/lib/useUnsavedChangesGuard';
import { useClientsStore } from '../../src/stores/useClientsStore';
import type { ClientInput } from '../../src/db/repositories/clients.repo';

export default function NewClientScreen() {
  const create = useClientsStore((s) => s.create);
  const [form, setForm] = useState<FormState<ClientInput> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const leave = useUnsavedChangesGuard(!!form?.isDirty && !isSaving);

  async function handleAdd() {
    if (!form?.canSubmit) return;
    setIsSaving(true);
    try {
      const client = await create(form.value);
      leave(() => router.replace(`/clients/${client.id}`));
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Could Not Add Client', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader
        title="New Client"
        actionLabel="Add"
        onAction={handleAdd}
        actionDisabled={!form?.canSubmit || isSaving}
      />
      <ClientForm onStateChange={setForm} />
    </View>
  );
}
