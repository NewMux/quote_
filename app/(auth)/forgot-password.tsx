import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { supabase } from '../../src/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL('/auth/callback'),
      });
      if (error) throw error;
      Alert.alert(
        'Check Your Email',
        'If an account exists for that email, we sent a link to reset your password.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Couldn’t Send Reset Link', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      actions={
        <>
          <Button label="Send Reset Link" size="large" disabled={!canSubmit} loading={isSubmitting} onPress={handleSubmit} />
          <TextLink label="Back to Sign In" onPress={() => router.back()} />
        </>
      }
    >
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        autoFocus
      />
    </AuthScreen>
  );
}
