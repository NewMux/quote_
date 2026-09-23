import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { FormField } from '../src/components/form/FormField';
import { ListRow } from '../src/components/list/ListRow';
import { ListSection } from '../src/components/list/ListSection';
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
    try {
      await updateProfile({ business_name: businessName.trim() });
      setStep(2);
    } catch (err) {
      Alert.alert('Couldn’t Save', err instanceof Error ? err.message : 'Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinueTaxRate() {
    if (chargesTax && taxName.trim()) {
      setIsSaving(true);
      try {
        const bracket = await createTaxRate({ name: taxName.trim(), rate_bp: parseRateBp(taxRate) });
        await setDefaultTaxRate(bracket.id);
      } catch (err) {
        setIsSaving(false);
        Alert.alert('Couldn’t Save', err instanceof Error ? err.message : 'Check your connection and try again.');
        return;
      }
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
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 24 }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="w-full max-w-[480px] self-center flex-1 gap-6">
          <View
            className="flex-row gap-1.5 justify-center"
            accessible
            accessibilityLabel={`Step ${step + 1} of ${TOTAL_STEPS}`}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-brand' : 'bg-fill'}`} />
            ))}
          </View>

          <View className="flex-1 justify-center gap-6">
            {step === 0 ? (
              <View className="gap-3">
                <Text className="text-title1 font-bold text-label text-center" accessibilityRole="header">
                  Welcome to Invoice Them
                </Text>
                <Text className="text-body text-secondary text-center">
                  Let&apos;s set up your business. It takes about a minute.
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View className="gap-5">
                <Text className="text-title1 font-bold text-label" accessibilityRole="header">
                  Your Business
                </Text>
                <FormField
                  label="Business Name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Sam's Plumbing"
                  textContentType="organizationName"
                  autoCapitalize="words"
                  maxLength={100}
                  returnKeyType="done"
                  autoFocus
                />
                <ListSection footer="Used for new documents. You can change it later in Settings.">
                  <ListRow
                    title="Currency"
                    value={`${getCurrencyName(currencyCode)} (${currencyCode})`}
                    onPress={() => router.push('/modals/currency-picker')}
                  />
                </ListSection>
              </View>
            ) : null}

            {step === 2 ? (
              <View className="gap-5">
                <Text className="text-title1 font-bold text-label" accessibilityRole="header">
                  Sales Tax
                </Text>
                <Text className="text-body text-secondary">Do you charge sales tax or VAT on what you sell?</Text>
                <ListSection
                  footer={chargesTax ? undefined : 'No problem — you can add tax rates anytime in Settings.'}
                >
                  <ListRow title="I Charge Sales Tax or VAT" switchValue={chargesTax} onSwitchChange={setChargesTax} />
                </ListSection>
                {chargesTax ? (
                  <View className="flex-row gap-3">
                    <View style={{ flex: 2 }}>
                      <FormField label="Name" placeholder="e.g. Sales Tax" value={taxName} onChangeText={setTaxName} />
                    </View>
                    <View className="flex-1">
                      <FormField
                        label="Rate (%)"
                        placeholder="8.25"
                        keyboardType="decimal-pad"
                        value={taxRate}
                        onChangeText={setTaxRate}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {step === 3 ? (
              <View className="gap-3">
                <Text className="text-title1 font-bold text-label text-center" accessibilityRole="header">
                  You&apos;re All Set
                </Text>
                <Text className="text-body text-secondary text-center">
                  You can change numbering and tax rates anytime in Settings.
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-2">
            {step === 0 ? <Button label="Get Started" size="large" onPress={() => setStep(1)} /> : null}
            {step === 1 ? (
              <>
                <Button
                  label="Continue"
                  size="large"
                  disabled={!businessName.trim()}
                  loading={isSaving}
                  onPress={handleContinueBusinessBasics}
                />
                <Button label="Back" variant="plain" onPress={() => setStep(0)} />
              </>
            ) : null}
            {step === 2 ? (
              <>
                <Button
                  label={chargesTax ? 'Continue' : 'Skip'}
                  size="large"
                  disabled={chargesTax && !taxName.trim()}
                  loading={isSaving}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
