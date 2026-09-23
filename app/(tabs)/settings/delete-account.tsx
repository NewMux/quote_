import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { deleteAccount } from '../../../src/db/repositories/account.repo';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL } from '../../../src/lib/subscription';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useSubscriptionStore } from '../../../src/stores/useSubscriptionStore';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountScreen() {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = confirmText === CONFIRM_WORD && !isDeleting;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteAccount();
      try {
        await supabase.auth.signOut();
      } catch {
        // The account is already gone server-side, so this network call may fail — the local
        // session is cleared explicitly below regardless of whether it does.
      }
      await useSubscriptionStore.getState().reset();
      useAuthStore.setState({ session: null });
      router.replace('/(auth)/sign-in');
    } catch (err) {
      setIsDeleting(false);
      Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="bg-white rounded-xl p-4 border border-red-200">
        <Text className="text-base font-semibold text-gray-900 mb-2">This can&apos;t be undone</Text>
        <Text className="text-sm text-gray-700 leading-5">
          This permanently deletes your account and everything in it — every client, invoice,
          estimate, item, tax rate, signature, photo, and payment record — and signs you out for
          good. There&apos;s no backup and no way to get this back. If you just want to clear your
          data and keep your account, use &quot;Delete All Data&quot; instead.
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 border border-gray-200">
        <Text className="text-sm text-gray-700 leading-5">
          Deleting your account doesn&apos;t cancel a Quote Pro subscription — Apple bills it
          separately. Cancel it first so you aren&apos;t charged again.
        </Text>
        <Pressable onPress={() => Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL)} hitSlop={8}>
          <Text className="text-sm text-brand font-medium mt-2">Manage Subscription</Text>
        </Pressable>
      </View>

      <View>
        <Text className="text-xs text-gray-500 mb-1">Type {CONFIRM_WORD} to confirm</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <Button
        label={isDeleting ? 'Deleting…' : 'Delete Account'}
        variant="destructive"
        size="large"
        disabled={!canDelete}
        onPress={handleDelete}
      />
    </ScrollView>
  );
}
