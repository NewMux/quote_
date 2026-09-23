import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/stores/useAuthStore';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Double-check both password fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to finish creating your account. Once confirmed, sign in below.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (err) {
      Alert.alert('Could not create account', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && confirmPassword.length > 0 && !isSubmitting;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <View className="flex-1 px-6 justify-center gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-label text-center">Create your account</Text>
          <Text className="text-base text-secondary text-center">Get started in under a minute</Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-xs text-secondary mb-1">Email</Text>
            <TextInput
              className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View>
            <Text className="text-xs text-secondary mb-1">Password</Text>
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
            <Text className="text-xs text-secondary mb-1">Confirm Password</Text>
            <TextInput
              className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>
        </View>
      </View>

      <View className="px-6 pb-6 gap-3">
        <Button
          label={isSubmitting ? 'Creating account…' : 'Create Account'}
          size="large"
          disabled={!canSubmit}
          onPress={handleSignUp}
        />
        <Pressable onPress={() => router.push('/(auth)/sign-in')} className="items-center py-2">
          <Text className="text-tint text-sm font-medium">Already have an account? Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
