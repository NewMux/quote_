import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

const MIN_PASSWORD_LENGTH = 8;

/** Reached only via the recovery link's auth/callback handoff, which has already established a
 * temporary session from the reset code — this screen just sets a new password on it. */
export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await useBusinessProfileStore.getState().load();
      const profile = useBusinessProfileStore.getState().profile;
      router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Couldn’t Update Password', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password && !isSubmitting;

  async function handleCancel() {
    // The recovery link signed them in temporarily; leaving without a new password signs them out.
    await useAuthStore.getState().signOut().catch(() => {});
    router.replace('/(auth)/sign-in');
  }

  return (
    <AuthScreen
      title="Set a New Password"
      subtitle="Choose a new password for your account."
      actions={
        <>
          <Button label="Update Password" size="large" disabled={!canSubmit} loading={isSubmitting} onPress={handleSubmit} />
          <TextLink label="Cancel" onPress={handleCancel} />
        </>
      }
    >
      <FormField
        label="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={password.length > 0 && password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={confirmRef}
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        error={mismatch ? "The passwords don't match." : null}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
    </AuthScreen>
  );
}
