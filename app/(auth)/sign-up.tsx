import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { useAuthStore } from '../../src/stores/useAuthStore';

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
      await signUp(email.trim(), password);
      Alert.alert(
        'Check Your Email',
        'We sent a link to confirm your account. After you confirm, come back and sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (err) {
      Alert.alert('Couldn’t Create Account', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Create Your Account"
      subtitle="It takes less than a minute."
      actions={
        <>
          <Button
            label="Create Account"
            size="large"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={handleSignUp}
          />
          <TextLink label="Already Have an Account? Sign In" onPress={() => router.replace('/(auth)/sign-in')} />
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={passwordTooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        submitBehavior="submit"
      />
      <FormField
        ref={confirmRef}
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        autoCapitalize="none"
        error={mismatch ? "The passwords don't match." : null}
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
      />
    </AuthScreen>
  );
}
