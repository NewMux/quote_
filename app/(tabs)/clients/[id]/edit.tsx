import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ClientForm } from '../../../../src/components/ClientForm';
import { getClient, type ClientInput } from '../../../../src/db/repositories/clients.repo';
import { useClientsStore } from '../../../../src/stores/useClientsStore';
import type { Client } from '../../../../src/types/models';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const update = useClientsStore((s) => s.update);
  const [client, setClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getClient(id).then(setClient);
  }, [id]);

  useEffect(() => {
    if (client) navigation.setOptions({ title: `Edit ${client.display_name}` });
  }, [navigation, client]);

  async function handleSubmit(input: ClientInput) {
    setIsSaving(true);
    await update(id, input);
    setIsSaving(false);
    router.back();
  }

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return <ClientForm initial={client} onSubmit={handleSubmit} isSaving={isSaving} />;
}
