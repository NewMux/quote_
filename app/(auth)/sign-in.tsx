import { useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen, TextLink } from '../../src/components/auth/AuthScreen';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/form/FormField';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

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
      Alert.alert('Couldn’t Sign In', err instanceof Error ? err.message : 'Check your email and password, then try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Welcome Back"
      subtitle="Sign in to Invoice Them"
      actions={
        <>
          <Button label="Sign In" size="large" disabled={!canSubmit} loading={isSubmitting} onPress={handleSignIn} />
          <TextLink label="Forgot Password?" onPress={() => router.push('/(auth)/forgot-password')} />
          <TextLink label="New to Invoice Them? Create an Account" onPress={() => router.replace('/(auth)/sign-up')} />
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
        textContentType="password"
        autoComplete="current-password"
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
      />
    </AuthScreen>
  );
}
