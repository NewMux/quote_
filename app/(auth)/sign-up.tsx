import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { t, tp } from '../../src/lib/i18n';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit =
    email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password && !isSubmitting;

  async function handleSignUp() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { accountExists } = await signUp(email.trim(), password);
      if (accountExists) {
        // No email goes out for an address that's already registered, so don't promise one.
        Alert.alert(t('You Already Have an Account'), t('There’s already an account for this email. Sign in, or reset your password if you’ve forgotten it.'), [
          { text: t('Sign In'), onPress: () => router.replace('/(auth)/sign-in') },
          { text: t('Reset Password'), onPress: () => router.replace('/(auth)/forgot-password') },
          { text: t('Cancel'), style: 'cancel' },
        ]);
        return;
      }
      Alert.alert(
        t('Check Your Email'),
        t('We sent a link to confirm your account. After you confirm, come back and sign in.'),
        [{ text: t('OK'), onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (err) {
      Alert.alert(t('Couldn’t Create Account'), err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title={t('Create Your Account')}
      subtitle={t('It takes less than a minute.')}
      actions={
        <>
          <Button
            label={t('Create Account')}
            size="large"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSignUp}
          />
          <TextLink label={t('Already Have an Account? Sign In')} onPress={() => router.replace('/(auth)/sign-in')} />
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
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        hint={tp(MIN_PASSWORD_LENGTH, 'At least {count} character.', 'At least {count} characters.')}
        error={passwordTooShort ? tp(MIN_PASSWORD_LENGTH, 'Use at least {count} character.', 'Use at least {count} characters.') : null}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={confirmRef}
        label={t('Confirm Password')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        error={mismatch ? t("The passwords don't match.") : null}
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
      />
    </AuthScreen>
  );
}
