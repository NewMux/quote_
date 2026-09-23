import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { supabase } from '../../src/lib/supabase';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

const MIN_PASSWORD_LENGTH = 8;

/** Reached only via the recovery link's auth/callback handoff, which has already established a
 * temporary session from the reset code — this screen just sets a new password on it. */
export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Double-check both password fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await useBusinessProfileStore.getState().load();
      const profile = useBusinessProfileStore.getState().profile;
      router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Could not update password', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && confirmPassword.length > 0 && !isSubmitting;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <View className="flex-1 px-6 justify-center gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-label text-center">Set a new password</Text>
          <Text className="text-base text-secondary text-center">Choose a new password for your account</Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-xs text-secondary mb-1">New Password</Text>
            <TextInput
              className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
              value={password}
              onChangeText={setPassword}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>
          <View>
            <Text className="text-xs text-secondary mb-1">Confirm New Password</Text>
            <TextInput
              className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your new password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>
        </View>
      </View>

      <View className="px-6 pb-6">
        <Button
          label={isSubmitting ? 'Updating…' : 'Update Password'}
          size="large"
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
