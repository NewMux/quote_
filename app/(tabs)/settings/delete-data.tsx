import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { wipeAllData } from '../../../src/db/repositories/dataManagement.repo';
import { wipeAllFiles } from '../../../src/lib/fileStorage';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';

const CONFIRM_WORD = 'DELETE';

export default function DeleteDataScreen() {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = confirmText === CONFIRM_WORD && !isDeleting;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await wipeAllData();
      await wipeAllFiles();
      await useBusinessProfileStore.getState().load();
      router.replace('/onboarding');
    } catch (err) {
      setIsDeleting(false);
      Alert.alert('Could not delete data', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <ScrollView className="flex-1 bg-grouped" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="bg-card rounded-xl p-4 border border-destructive/30">
        <Text className="text-base font-semibold text-label mb-2">This can&apos;t be undone</Text>
        <Text className="text-sm text-label leading-5">
          This permanently erases every client, invoice, estimate, item, tax rate, signature,
          photo, and payment record in your account — and resets your business profile.
          There&apos;s no backup and no way to get this back.
        </Text>
      </View>

      <View>
        <Text className="text-xs text-secondary mb-1">Type {CONFIRM_WORD} to confirm</Text>
        <TextInput
          className="border border-field rounded-lg px-3 py-2 text-base text-label bg-card"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <Button
        label={isDeleting ? 'Deleting…' : 'Delete All Data'}
        variant="destructive"
        size="large"
        disabled={!canDelete}
        onPress={handleDelete}
      />
    </ScrollView>
  );
}
