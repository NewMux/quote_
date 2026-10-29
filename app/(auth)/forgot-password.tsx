import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AUTH_CALLBACK_URL } from '../../src/lib/authCallbackUrl';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { supabase } from '../../src/lib/supabase';
import { t } from '../../src/lib/i18n';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = email.trim().length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: AUTH_CALLBACK_URL,
      });
      if (error) throw error;
      Alert.alert(
        t('Check Your Email'),
        t('If an account exists for that email, we sent a link to reset your password.'),
        [{ text: t('OK'), onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert(t('Couldn’t Send Reset Link'), err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={t('Reset Your Password')}
      subtitle={t("Enter your email and we'll send you a link to set a new password.")}
      actions={
        <>
          <Button label={t('Send Reset Link')} size="large" disabled={!canSubmit} loading={isSubmitting} onPress={handleSubmit} />
          <TextLink label={t('Back to Sign In')} onPress={() => router.back()} />
        </>
      }
    >
      <FormField
        label={t('Email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('you@example.com')}
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
