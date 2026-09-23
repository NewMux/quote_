import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/form/FormField';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { useThemeColors } from '../../../src/lib/theme';
import { wipeAllData } from '../../../src/db/repositories/dataManagement.repo';
import { wipeAllFiles } from '../../../src/lib/fileStorage';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';

const CONFIRM_WORD = 'DELETE';

export default function DeleteDataScreen() {
  const [confirmText, setConfirmText] = useState('');
  const colors = useThemeColors();
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
      Alert.alert('Couldn’t Delete Data', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <FormScrollView>
      <View className="items-center gap-2 pt-2">
        <Ionicons name="warning" size={44} color={colors.destructive} />
        <Text className="text-xl font-semibold text-label text-center" accessibilityRole="header">
          This Can’t Be Undone
        </Text>
        <Text className="text-base text-secondary text-center">
          This permanently erases every client, invoice, estimate, item, tax rate, signature, photo,
          and payment record in your account, and resets your business profile. Your account and
          sign-in stay the same.
        </Text>
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
        label="Delete All Data"
        variant="destructive"
        size="large"
        disabled={!canDelete}
        loading={isDeleting}
        onPress={handleDelete}
      />
    </FormScrollView>
  );
}
