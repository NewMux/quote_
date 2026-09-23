import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { FormRow } from '../src/components/form/FormRow';
import { Icon } from '../src/components/Icon';
import { ListRow } from '../src/components/list/ListRow';
import { ListSection } from '../src/components/list/ListSection';
import { getCurrencyName } from '../src/lib/currencies';
import { parseRateBp } from '../src/lib/money';
import type { SymbolName } from '../src/lib/symbols';
import { useSystemColors } from '../src/lib/theme';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useTaxBracketsStore } from '../src/stores/useTaxBracketsStore';

const TOTAL_STEPS = 4;

const WELCOME_FEATURES: { icon: SymbolName; title: string; detail: string }[] = [
  { icon: 'doc.text.fill', title: 'Estimates and Invoices', detail: 'Professional PDFs with your logo, ready to send.' },
  { icon: 'signature', title: 'Signatures', detail: 'Sign and collect your client’s signature on the spot.' },
  { icon: 'banknote.fill', title: 'Get Paid', detail: 'Track payments and see what’s overdue at a glance.' },
];

export default function OnboardingScreen() {
  const profile = useBusinessProfileStore((s) => s.profile);
  const updateProfile = useBusinessProfileStore((s) => s.update);
  const createTaxRate = useTaxBracketsStore((s) => s.create);
  const setDefaultTaxRate = useTaxBracketsStore((s) => s.setDefault);
  const system = useSystemColors();

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
              <View className="gap-8">
                <View className="items-center gap-3">
                  <View
                    className="w-20 h-20 rounded-[22px] bg-brand items-center justify-center mb-1"
                    style={{ borderCurve: 'continuous' }}
                  >
                    <Icon name="doc.text.fill" size={40} color="#FFFFFF" />
                  </View>
                  <Text className="text-largetitle font-bold text-label text-center" accessibilityRole="header">
                    Welcome to Invoice Them
                  </Text>
                </View>
                {/* Apple's welcome-screen pattern: three tinted symbols, each with a one-line promise. */}
                <View className="gap-5 px-2">
                  {WELCOME_FEATURES.map((feature) => (
                    <View key={feature.title} className="flex-row items-center gap-4">
                      <Icon name={feature.icon} size={30} />
                      <View className="flex-1">
                        <Text className="text-headline font-semibold text-label">{feature.title}</Text>
                        <Text className="text-subhead text-secondary">{feature.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {step === 1 ? (
              <View className="gap-5">
                <Text className="text-largetitle font-bold text-label" accessibilityRole="header">
                  Your Business
                </Text>
                <ListSection footer="Your business name appears on every document. The currency is used for new documents; you can change both later in Settings.">
                  <FormRow
                    label="Name"
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="e.g. Sam's Plumbing"
                    textContentType="organizationName"
                    autoCapitalize="words"
                    maxLength={100}
                    returnKeyType="done"
                    autoFocus
                  />
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
                <Text className="text-largetitle font-bold text-label" accessibilityRole="header">
                  Sales Tax
                </Text>
                <Text className="text-body text-secondary">Do you charge sales tax or VAT on what you sell?</Text>
                <ListSection
                  footer={chargesTax ? undefined : 'No problem — you can add tax rates anytime in Settings.'}
                >
                  <ListRow title="I Charge Sales Tax or VAT" switchValue={chargesTax} onSwitchChange={setChargesTax} />
                </ListSection>
                {chargesTax ? (
                  <ListSection>
                    <FormRow label="Name" placeholder="e.g. Sales Tax" value={taxName} onChangeText={setTaxName} />
                    <FormRow
                      label="Rate (%)"
                      placeholder="8.25"
                      keyboardType="decimal-pad"
                      value={taxRate}
                      onChangeText={setTaxRate}
                    />
                  </ListSection>
                ) : null}
              </View>
            ) : null}

            {step === 3 ? (
              <View className="gap-3 items-center">
                <Icon name="checkmark.circle.fill" size={72} color={system.green} />
                <Text className="text-largetitle font-bold text-label text-center" accessibilityRole="header">
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
