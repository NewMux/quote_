import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../src/components/Button';
import { FormField } from '../../../src/components/form/FormField';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { persistPickedFile } from '../../../src/lib/fileStorage';
import { newId } from '../../../src/lib/id';
import { useSaveHeader } from '../../../src/lib/useSaveHeader';
import { useSignedUrl } from '../../../src/lib/useSignedUrl';
import { useUnsavedChangesGuard } from '../../../src/lib/useUnsavedChangesGuard';
import { getCurrencyName } from '../../../src/lib/currencies';

/** Accent colors for the PDF header. They're printed on white paper, so they don't change with the
 * app's appearance. */
const ACCENT_COLORS = [
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#059669', name: 'Green' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#D97706', name: 'Orange' },
  { hex: '#7C3AED', name: 'Purple' },
  { hex: '#0891B2', name: 'Teal' },
  { hex: '#111827', name: 'Black' },
];

export default function BusinessProfileScreen() {
  const { profile, load, update } = useBusinessProfileStore();

  const [businessName, setBusinessName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxRegNumber, setTaxRegNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [footerTerms, setFooterTerms] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const signedLogoUrl = useSignedUrl(logoUri);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name);
    setLogoUri(profile.logo_uri);
    setAccentColor(profile.accent_color);
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setTaxRegNumber(profile.tax_registration_number ?? '');
    setPaymentInstructions(profile.payment_instructions ?? '');
    setFooterTerms(profile.footer_terms ?? '');
  }, [profile]);

  const isDirty =
    !!profile &&
    (businessName !== profile.business_name ||
      logoUri !== profile.logo_uri ||
      accentColor !== profile.accent_color ||
      email !== (profile.email ?? '') ||
      phone !== (profile.phone ?? '') ||
      address !== (profile.address ?? '') ||
      taxRegNumber !== (profile.tax_registration_number ?? '') ||
      paymentInstructions !== (profile.payment_instructions ?? '') ||
      footerTerms !== (profile.footer_terms ?? ''));
  const leave = useUnsavedChangesGuard(isDirty && !isSaving);
  const canSave = isDirty && !!businessName.trim() && !isSaving;

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Allow photo access in the Settings app to add your logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    // A unique name per upload, so replacing the logo gets a new path — the old file is deleted on
    // save, and no cached signed URL or image can keep showing the previous logo.
    const persistedUri = await persistPickedFile(result.assets[0].uri, 'branding', `logo-${newId()}.jpg`);
    setLogoUri(persistedUri);
  }

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await update({
        business_name: businessName.trim(),
        logo_uri: logoUri,
        accent_color: accentColor,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        tax_registration_number: taxRegNumber.trim() || null,
        payment_instructions: paymentInstructions.trim() || null,
        footer_terms: footerTerms.trim() || null,
      });
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Profile', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  useSaveHeader({ onSave: handleSave, disabled: !canSave });

  const currencyCode = profile?.default_currency_code ?? 'USD';

  return (
    <FormScrollView>
      <View className="items-center gap-2">
        {signedLogoUrl ? (
          <Image
            source={{ uri: signedLogoUrl }}
            className="w-24 h-24 rounded-2xl bg-card"
            resizeMode="contain"
            accessibilityLabel="Business logo"
          />
        ) : (
          <View className="w-24 h-24 rounded-2xl bg-card items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#8E8E93" />
          </View>
        )}
        <Button label={logoUri ? 'Change Logo' : 'Add Logo'} variant="plain" onPress={pickLogo} />
      </View>

      <FormField
        label="Business Name"
        value={businessName}
        onChangeText={setBusinessName}
        textContentType="organizationName"
        autoCapitalize="words"
        maxLength={100}
        error={businessName.trim() ? null : 'Your business name appears on every document.'}
      />

      <View>
        <Text className="text-sm text-secondary mb-1.5">Accent Color</Text>
        <View className="flex-row flex-wrap gap-1" accessibilityRole="radiogroup">
          {ACCENT_COLORS.map((color) => {
            const selected = accentColor === color.hex;
            return (
              <Pressable
                key={color.hex}
                onPress={() => setAccentColor(color.hex)}
                accessibilityRole="radio"
                accessibilityLabel={color.name}
                accessibilityState={{ checked: selected }}
                className="w-11 h-11 items-center justify-center"
              >
                <View
                  style={{ backgroundColor: color.hex }}
                  className={`w-9 h-9 rounded-full items-center justify-center ${selected ? 'border-2 border-label' : ''}`}
                >
                  {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-sm text-secondary mt-1.5">Used for headings on your PDFs.</Text>
      </View>

      <View>
        <ListSection footer="The currency for new documents.">
          <ListRow
            title="Currency"
            value={`${getCurrencyName(currencyCode)} (${currencyCode})`}
            onPress={() => router.push('/modals/currency-picker')}
          />
        </ListSection>
      </View>

      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={150}
      />
      <FormField
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={30}
      />
      <FormField
        label="Address"
        value={address}
        onChangeText={setAddress}
        multiline
        textContentType="fullStreetAddress"
        autoComplete="street-address"
        maxLength={500}
      />
      <FormField
        label="Tax / VAT Registration Number"
        value={taxRegNumber}
        onChangeText={setTaxRegNumber}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={50}
      />
      <FormField
        label="Payment Instructions"
        hint="Shown on invoices, e.g. your bank details."
        value={paymentInstructions}
        onChangeText={setPaymentInstructions}
        multiline
        maxLength={1000}
      />
      <FormField
        label="Default Terms"
        hint="Printed at the bottom of every document unless you change them on a document."
        value={footerTerms}
        onChangeText={setFooterTerms}
        multiline
        maxLength={2000}
      />
    </FormScrollView>
  );
}
