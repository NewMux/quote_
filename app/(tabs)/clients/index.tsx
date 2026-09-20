import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../src/components/Avatar';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { useClientsStore } from '../../../src/stores/useClientsStore';

export default function ClientsScreen() {
  const { clients, load } = useClientsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <EmptyState title="No clients yet" subtitle="Add a client to start building documents for them." />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/clients/${item.id}`)}>
            <Card className="p-4 flex-row items-center gap-3">
              <Avatar name={item.display_name} photoUri={item.photo_uri} seed={item.id} size={44} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{item.display_name}</Text>
                {item.email ? <Text className="text-sm text-gray-500">{item.email}</Text> : null}
                {item.phone ? <Text className="text-sm text-gray-500">{item.phone}</Text> : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push('/clients/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
