import { useState } from 'react';
import { Alert, Text, View, Linking } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../../src/components/Icon';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/form/FormField';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { useThemeColors } from '../../../src/lib/theme';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { deleteAccount } from '../../../src/db/repositories/account.repo';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL } from '../../../src/lib/subscription';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useSubscriptionStore } from '../../../src/stores/useSubscriptionStore';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountScreen() {
  const [confirmText, setConfirmText] = useState('');
  const colors = useThemeColors();
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
      Alert.alert('Couldn’t Delete Account', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <FormScrollView contentContainerStyle={{ gap: 24, paddingTop: 16 }}>
      <View className="items-center gap-2 pt-2">
        <Icon name="exclamationmark.triangle.fill" size={48} color={colors.destructive} />
        <Text className="text-title2 font-semibold text-label text-center" accessibilityRole="header">
          This Can’t Be Undone
        </Text>
        <Text className="text-body text-secondary text-center">
          This permanently deletes your account and everything in it — every client, invoice,
          estimate, item, tax rate, signature, photo, and payment record — and signs you out. To
          clear your data but keep your account, use Delete All Data instead.
        </Text>
      </View>

      <View>
        <ListSection footer="Deleting your account doesn't cancel an Invoice Them Pro subscription — Apple bills it separately. Cancel it first so you aren't charged again.">
          <ListRow
            title="Manage Subscription"
            onPress={() => Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL)}
            accessory="none"
            accessibilityHint="Opens your App Store subscriptions"
          />
        </ListSection>
      </View>

      <FormField
        label={`Type ${CONFIRM_WORD} to Confirm`}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="done"
      />

      <Button
        label="Delete Account"
        variant="destructive"
        size="large"
        disabled={!canDelete}
        loading={isDeleting}
        onPress={handleDelete}
      />
    </FormScrollView>
  );
}
