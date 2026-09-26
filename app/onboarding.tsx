import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { FormRow } from '../src/components/form/FormRow';
import { Icon } from '../src/components/Icon';
import { ListRow } from '../src/components/list/ListRow';
import { ListSection } from '../src/components/list/ListSection';
import { getCurrencyName } from '../src/lib/currencies';
import { persistPickedFile } from '../src/lib/fileStorage';
import { newId } from '../src/lib/id';
import { useSignedUrl } from '../src/lib/useSignedUrl';
import { parseRateBp } from '../src/lib/money';
import type { SymbolName } from '../src/lib/symbols';
import { useSystemColors } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useTaxBracketsStore } from '../src/stores/useTaxBracketsStore';

const TOTAL_STEPS = 5;

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
  const accountEmail = useAuthStore((s) => s.session?.user.email ?? '');
  const [email, setEmail] = useState(profile?.email ?? accountEmail);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoUrl = useSignedUrl(profile?.logo_uri);

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

  /** The logo saves as soon as it's picked, like in Business Profile. */
  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Allow photo access in the Settings app to add your logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setIsUploadingLogo(true);
    try {
      const path = await persistPickedFile(result.assets[0].uri, 'branding', `logo-${newId()}.jpg`);
      await updateProfile({ logo_uri: path });
    } catch (err) {
      Alert.alert('Couldn’t Add Logo', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsUploadingLogo(false);
    }
  }

  const hasDetails = !!(email.trim() || phone.trim() || address.trim() || profile?.logo_uri);

  async function handleContinueDetails() {
    setIsSaving(true);
    try {
      await updateProfile({ email: email.trim() || null, phone: phone.trim() || null, address: address.trim() || null });
      setStep(3);
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
    setStep(4);
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
                  Your Details
                </Text>
                <Text className="text-body text-secondary">
                  These go on every invoice, so clients know who it&apos;s from and how to reach you.
                </Text>
                <View className="items-center gap-1">
                  <Pressable
                    onPress={pickLogo}
                    disabled={isUploadingLogo}
                    accessibilityRole="button"
                    accessibilityLabel={logoUrl ? 'Change Logo' : 'Add Logo'}
                    className="w-24 h-24 rounded-3xl bg-card items-center justify-center overflow-hidden"
                    style={{ borderCurve: 'continuous' }}
                  >
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} className="w-24 h-24" resizeMode="contain" />
                    ) : (
                      <Icon name="photo" size={34} color={system.gray} />
                    )}
                    {isUploadingLogo ? (
                      <View className="absolute inset-0 items-center justify-center bg-card/70">
                        <ActivityIndicator />
                      </View>
                    ) : null}
                  </Pressable>
                  <Button label={logoUrl ? 'Change Logo' : 'Add Logo'} variant="plain" size="small" disabled={isUploadingLogo} onPress={pickLogo} />
                </View>
                <ListSection footer="All optional. You can change them later in Settings → Business Profile.">
                  <FormRow
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Optional"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={150}
                  />
                  <FormRow
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Optional"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    maxLength={30}
                  />
                  <FormRow
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Optional"
                    multiline
                    textContentType="fullStreetAddress"
                    autoComplete="street-address"
                    maxLength={500}
                  />
                </ListSection>
              </View>
            ) : null}

            {step === 3 ? (
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

            {step === 4 ? (
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
                <Button label={hasDetails ? 'Continue' : 'Skip'} size="large" loading={isSaving} disabled={isUploadingLogo} onPress={handleContinueDetails} />
                <Button label="Back" variant="plain" onPress={() => setStep(1)} />
              </>
            ) : null}
            {step === 3 ? (
              <>
                <Button
                  label={chargesTax ? 'Continue' : 'Skip'}
                  size="large"
                  disabled={chargesTax && !taxName.trim()}
                  loading={isSaving}
                  onPress={handleContinueTaxRate}
                />
                <Button label="Back" variant="plain" onPress={() => setStep(2)} />
              </>
            ) : null}
            {step === 4 ? (
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
