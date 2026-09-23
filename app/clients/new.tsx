import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ClientForm } from '../../src/components/ClientForm';
import { SheetHeader } from '../../src/components/SheetHeader';
import { useClientsStore } from '../../src/stores/useClientsStore';
import type { ClientInput } from '../../src/db/repositories/clients.repo';

export default function NewClientScreen() {
  const create = useClientsStore((s) => s.create);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(input: ClientInput) {
    setIsSaving(true);
    const client = await create(input);
    setIsSaving(false);
    router.replace(`/clients/${client.id}`);
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader title="New Client" />
      <ClientForm onSubmit={handleSubmit} isSaving={isSaving} />
    </View>
  );
}
