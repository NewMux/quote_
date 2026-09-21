import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { getCurrencyName } from '../src/lib/currencies';
import { parseRateBp } from '../src/lib/money';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useTaxBracketsStore } from '../src/stores/useTaxBracketsStore';

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const profile = useBusinessProfileStore((s) => s.profile);
  const updateProfile = useBusinessProfileStore((s) => s.update);
  const createTaxRate = useTaxBracketsStore((s) => s.create);
  const setDefaultTaxRate = useTaxBracketsStore((s) => s.setDefault);

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [chargesTax, setChargesTax] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currencyCode = profile?.default_currency_code ?? 'USD';

  async function handleContinueBusinessBasics() {
    if (!businessName.trim()) return;
    setIsSaving(true);
    await updateProfile({ business_name: businessName.trim() });
    setIsSaving(false);
    setStep(2);
  }

  async function handleContinueTaxRate() {
    if (chargesTax && taxName.trim()) {
      setIsSaving(true);
      const bracket = await createTaxRate({ name: taxName.trim(), rate_bp: parseRateBp(taxRate) });
      await setDefaultTaxRate(bracket.id);
      setIsSaving(false);
    }
    setStep(3);
  }

  function finish(target: 'invoice' | 'home') {
    if (target === 'invoice') {
      router.replace({ pathname: '/documents/new', params: { type: 'invoice' } });
    } else {
      router.replace('/(tabs)/home');
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface">
      <View className="px-6 pt-4">
        <Text className="text-xs text-gray-400 text-center">
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <View className="flex-1 px-6 justify-center gap-6">
        {step === 0 ? (
          <View className="gap-3">
            <Text className="text-2xl font-bold text-gray-900 text-center">Welcome!</Text>
            <Text className="text-base text-gray-500 text-center">
              Let's get your business set up — this takes about a minute.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-gray-900">Your Business</Text>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Business Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Sam's Plumbing"
                autoFocus
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Currency</Text>
              <Pressable
                onPress={() => router.push('/modals/currency-picker')}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white flex-row justify-between items-center"
              >
                <Text className="text-base text-gray-900">
                  {getCurrencyName(currencyCode)} ({currencyCode})
                </Text>
                <Text className="text-gray-400">›</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4">
            <Text className="text-2xl font-bold text-gray-900">Sales Tax</Text>
            <Text className="text-base text-gray-500">Do you charge sales tax or VAT on what you sell?</Text>
            <View className="flex-row items-center justify-between bg-white rounded-lg border border-gray-300 px-3 py-3">
              <Text className="text-base text-gray-900">I charge sales tax or VAT</Text>
              <Switch value={chargesTax} onValueChange={setChargesTax} />
            </View>
            {chargesTax ? (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
                  placeholder="e.g. Sales Tax"
                  value={taxName}
                  onChangeText={setTaxName}
                />
                <TextInput
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
                  placeholder="Rate %"
                  keyboardType="decimal-pad"
                  value={taxRate}
                  onChangeText={setTaxRate}
                />
              </View>
            ) : (
              <Text className="text-xs text-gray-400">No problem — you can add this anytime in Settings.</Text>
            )}
          </View>
        ) : null}

        {step === 3 ? (
          <View className="gap-3">
            <Text className="text-2xl font-bold text-gray-900 text-center">You're all set!</Text>
            <Text className="text-base text-gray-500 text-center">
              You can customize invoice numbering and tax rates anytime in Settings.
            </Text>
          </View>
        ) : null}
      </View>

      <View className="px-6 pb-6 gap-3">
        {step === 0 ? <Button label="Get Started" size="large" onPress={() => setStep(1)} /> : null}
        {step === 1 ? (
          <>
            <Button
              label={isSaving ? 'Saving…' : 'Continue'}
              size="large"
              disabled={!businessName.trim() || isSaving}
              onPress={handleContinueBusinessBasics}
            />
            <Button label="Back" variant="plain" onPress={() => setStep(0)} />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Button
              label={isSaving ? 'Saving…' : chargesTax ? 'Continue' : 'Skip'}
              size="large"
              disabled={isSaving || (chargesTax && !taxName.trim())}
              onPress={handleContinueTaxRate}
            />
            <Button label="Back" variant="plain" onPress={() => setStep(1)} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Button label="Create Your First Invoice" size="large" onPress={() => finish('invoice')} />
            <Button label="Explore the App" variant="plain" onPress={() => finish('home')} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
