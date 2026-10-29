import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';
import { t } from '../../src/lib/i18n';

function isEmailNotConfirmed(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'email_not_confirmed';
}

async function handleResend(email: string) {
  try {
    await useAuthStore.getState().resendConfirmation(email);
    Alert.alert(t('Check Your Email'), t('We sent a new confirmation link to {email}.', { email }));
  } catch (err) {
    Alert.alert(t('Couldn’t Send Email'), err instanceof Error ? err.message : t('Something went wrong.'));
  }
}

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSignIn() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      await useBusinessProfileStore.getState().load();
      const profile = useBusinessProfileStore.getState().profile;
      router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
    } catch (err) {
      if (isEmailNotConfirmed(err)) {
        Alert.alert(
          t('Confirm Your Email'),
          t('Tap the link in the email we sent when you signed up. If it expired or never arrived, we can send a new one.'),
          [
            { text: t('Cancel'), style: 'cancel' },
            { text: t('Resend Email'), onPress: () => handleResend(email.trim()) },
          ]
        );
        return;
      }
      Alert.alert(t('Couldn’t Sign In'), err instanceof Error ? err.message : t('Check your email and password, then try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={t('Welcome Back')}
      subtitle={t('Sign in to Invoice Them')}
      actions={
        <>
          <Button label={t('Sign In')} size="large" disabled={!canSubmit} loading={isSubmitting} onPress={handleSignIn} />
          <TextLink label={t('Forgot Password?')} onPress={() => router.push('/(auth)/forgot-password')} />
          <TextLink label={t('New to Invoice Them? Create an Account')} onPress={() => router.replace('/(auth)/sign-up')} />
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={passwordRef}
        label={t('Password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
      />
    </AuthScreen>
  );
}
