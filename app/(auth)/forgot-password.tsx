import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { supabase } from '../../src/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL('/auth/callback'),
      });
      if (error) throw error;
      Alert.alert(
        'Check your email',
        'If an account exists for that email, we sent a link to reset your password.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (err) {
      Alert.alert('Could not send reset link', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 0 && !isSubmitting;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface">
      <View className="flex-1 px-6 justify-center gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-gray-900 text-center">Reset your password</Text>
          <Text className="text-base text-gray-500 text-center">
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
      </View>

      <View className="px-6 pb-6 gap-3">
        <Button
          label={isSubmitting ? 'Sending…' : 'Send Reset Link'}
          size="large"
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
        <Pressable onPress={() => router.back()} className="items-center py-2">
          <Text className="text-brand text-sm font-medium">Back to Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
