import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      await useBusinessProfileStore.getState().load();
      const profile = useBusinessProfileStore.getState().profile;
      router.replace(profile?.business_name?.trim() ? '/(tabs)/home' : '/onboarding');
    } catch (err) {
      Alert.alert('Could not sign in', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <View className="flex-1 px-6 justify-center gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-label text-center">Welcome back</Text>
          <Text className="text-base text-secondary text-center">Sign in to your account</Text>
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
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')} className="self-end">
            <Text className="text-tint text-sm font-medium">Forgot password?</Text>
          </Pressable>
        </View>
      </View>

      <View className="px-6 pb-6 gap-3">
        <Button
          label={isSubmitting ? 'Signing in…' : 'Sign In'}
          size="large"
          disabled={!canSubmit}
          onPress={handleSignIn}
        />
        <Pressable onPress={() => router.push('/(auth)/sign-up')} className="items-center py-2">
          <Text className="text-tint text-sm font-medium">Don&apos;t have an account? Sign Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
