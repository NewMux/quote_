import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/Button';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { persistPickedFile } from '../../../src/lib/fileStorage';
import { newId } from '../../../src/lib/id';
import { useSignedUrl } from '../../../src/lib/useSignedUrl';
import { getCurrencyName } from '../../../src/lib/currencies';

const ACCENT_COLORS = ['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2', '#111827'];

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

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to set a logo.');
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
    setIsSaving(true);
    await update({
      business_name: businessName,
      logo_uri: logoUri,
      accent_color: accentColor,
      email: email || null,
      phone: phone || null,
      address: address || null,
      tax_registration_number: taxRegNumber || null,
      payment_instructions: paymentInstructions || null,
      footer_terms: footerTerms || null,
    });
    setIsSaving(false);
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xs text-gray-500 mb-2">Logo</Text>
        {signedLogoUrl ? (
          <Image source={{ uri: signedLogoUrl }} className="w-24 h-24 rounded-lg mb-2" resizeMode="contain" />
        ) : null}
        <View className="self-start">
          <Button label={logoUri ? 'Change logo' : 'Add logo'} variant="tinted" onPress={pickLogo} />
        </View>
      </View>

      <Field label="Business Name" value={businessName} onChangeText={setBusinessName} />

      <View>
        <Text className="text-xs text-gray-500 mb-2">Accent Color</Text>
        <View className="flex-row gap-2">
          {ACCENT_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => setAccentColor(color)}
              style={{ backgroundColor: color }}
              className={`w-9 h-9 rounded-full ${accentColor === color ? 'border-2 border-gray-900' : ''}`}
            />
          ))}
        </View>
      </View>

      <View>
        <Text className="text-xs text-gray-500 mb-1">Currency</Text>
        <Pressable
          onPress={() => router.push('/modals/currency-picker')}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white flex-row justify-between items-center"
        >
          <Text className="text-base text-gray-900">
            {getCurrencyName(profile?.default_currency_code ?? 'USD')} ({profile?.default_currency_code ?? 'USD'})
          </Text>
          <Text className="text-gray-400">›</Text>
        </Pressable>
      </View>

      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Address" value={address} onChangeText={setAddress} multiline />
      <Field label="Tax / VAT Registration Number" value={taxRegNumber} onChangeText={setTaxRegNumber} />
      <Field
        label="Payment Instructions"
        value={paymentInstructions}
        onChangeText={setPaymentInstructions}
        multiline
      />
      <Field label="Footer / Terms & Conditions" value={footerTerms} onChangeText={setFooterTerms} multiline />

      <View className="mt-2">
        <Button label={isSaving ? 'Saving…' : 'Save'} variant="filled" size="large" disabled={isSaving} onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'email-address' | 'phone-pad';
}) {
  return (
    <View>
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}
