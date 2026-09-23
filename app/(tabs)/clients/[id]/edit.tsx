import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ClientForm } from '../../../../src/components/ClientForm';
import type { FormState } from '../../../../src/components/form/useFormState';
import { getClient, type ClientInput } from '../../../../src/db/repositories/clients.repo';
import { useSaveHeader } from '../../../../src/lib/useSaveHeader';
import { useUnsavedChangesGuard } from '../../../../src/lib/useUnsavedChangesGuard';
import { useClientsStore } from '../../../../src/stores/useClientsStore';
import type { Client } from '../../../../src/types/models';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const update = useClientsStore((s) => s.update);
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState<ClientInput> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const leave = useUnsavedChangesGuard(!!form?.isDirty && !isSaving);

  useEffect(() => {
    getClient(id).then(setClient);
  }, [id]);

  async function handleSave() {
    if (!form?.canSubmit) return;
    setIsSaving(true);
    try {
      await update(id, form.value);
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Could Not Save Client', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  useSaveHeader({ onSave: handleSave, disabled: !form?.canSubmit || !form.isDirty || isSaving });

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-grouped">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return <ClientForm initial={client} onStateChange={setForm} />;
}
