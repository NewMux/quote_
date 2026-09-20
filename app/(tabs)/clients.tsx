import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../src/components/EmptyState';
import { useClientsStore } from '../../src/stores/useClientsStore';

export default function ClientsScreen() {
  const { clients, load } = useClientsStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState title="No clients yet" subtitle="Add a client to start building documents for them." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/clients/${item.id}`)}
            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
          >
            <Text className="text-base font-semibold text-gray-900">{item.display_name}</Text>
            {item.email ? <Text className="text-sm text-gray-500">{item.email}</Text> : null}
            {item.phone ? <Text className="text-sm text-gray-500">{item.phone}</Text> : null}
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => router.push('/clients/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
