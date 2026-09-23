import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/Button';
import { GroupedCard } from '../../../src/components/GroupedCard';
import { Icon } from '../../../src/components/Icon';
import { FormRow } from '../../../src/components/form/FormRow';
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
import { useThemeColors } from '../../../src/lib/theme';

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
  const colors = useThemeColors();

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
      <View className="items-center gap-1 pb-4">
        {signedLogoUrl ? (
          <Image
            source={{ uri: signedLogoUrl }}
            className="w-24 h-24 rounded-3xl bg-card"
            resizeMode="contain"
            accessibilityLabel="Business logo"
          />
        ) : (
          <View
            className="w-24 h-24 rounded-3xl bg-card items-center justify-center"
            style={{ borderCurve: 'continuous' }}
          >
            <Icon name="photo" size={34} color={colors.secondary} />
          </View>
        )}
        <Button label={logoUri ? 'Edit Logo' : 'Add Logo'} variant="plain" size="small" onPress={pickLogo} />
      </View>

      <ListSection footer="Your business name appears on every document.">
        <FormRow
          label="Name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Required"
          textContentType="organizationName"
          autoCapitalize="words"
          maxLength={100}
          error={businessName.trim() ? null : 'Enter your business name.'}
        />
      </ListSection>

      <ListSection header="Contact">
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

      <ListSection footer="The currency for new documents.">
        <ListRow
          title="Currency"
          value={`${getCurrencyName(currencyCode)} (${currencyCode})`}
          onPress={() => router.push('/modals/currency-picker')}
        />
      </ListSection>

      <ListSection
        header="On Your Documents"
        footer="Payment instructions (such as bank details) print on invoices. Default terms print at the bottom of every document unless you change them on a document."
      >
        <FormRow
          label="Tax / VAT No."
          value={taxRegNumber}
          onChangeText={setTaxRegNumber}
          placeholder="Optional"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={50}
        />
        <FormRow
          label="Payment Instructions"
          value={paymentInstructions}
          onChangeText={setPaymentInstructions}
          placeholder="Optional"
          multiline
          maxLength={1000}
        />
        <FormRow
          label="Default Terms"
          value={footerTerms}
          onChangeText={setFooterTerms}
          placeholder="Optional"
          multiline
          maxLength={2000}
        />
      </ListSection>

      <GroupedCard header="PDF Accent Color" footer="Used for headings on your PDFs.">
        <View className="flex-row flex-wrap justify-between" accessibilityRole="radiogroup">
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
                  style={{ backgroundColor: color.hex, borderColor: selected ? colors.label : 'transparent' }}
                  className="w-10 h-10 rounded-full items-center justify-center border-[2.5px]"
                >
                  {selected ? <Icon name="checkmark" size={16} weight="bold" color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </GroupedCard>
    </FormScrollView>
  );
}
