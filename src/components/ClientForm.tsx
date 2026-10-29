import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { FormRow } from './form/FormRow';
import { FormScrollView } from './form/FormScrollView';
import { useReportFormState, type FormState } from './form/useFormState';
import { ListRow } from './list/ListRow';
import { ListSection } from './list/ListSection';
import { persistPickedFile } from '../lib/fileStorage';
import { pickContactAsClient } from '../lib/importContact';
import { newId } from '../lib/id';
import type { ClientInput } from '../db/repositories/clients.repo';
import type { Client } from '../types/models';
import { t } from '../lib/i18n';

interface ClientFormProps {
  initial?: Client;
  /** Receives the current input, validity, and dirtiness; the hosting screen owns the Save action. */
  onStateChange: (state: FormState<ClientInput>) => void;
  /** Extra rows rendered at the end of the form (e.g. destructive actions). */
  footer?: ReactNode;
}

export function ClientForm({ initial, onStateChange, footer }: ClientFormProps) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '');
  const [contactName, setContactName] = useState(initial?.contact_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [taxRegNumber, setTaxRegNumber] = useState(initial?.tax_registration_number ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photo_uri ?? null);
  const contactRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  useReportFormState<ClientInput>(
    {
      display_name: displayName.trim(),
      contact_name: contactName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      tax_registration_number: taxRegNumber.trim() || null,
      notes: notes.trim() || null,
      photo_uri: photoUri,
    },
    !!displayName.trim(),
    onStateChange
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  /** Fills the form from a phone contact. Only fields the contact has are replaced. */
  async function importFromContacts() {
    setIsImporting(true);
    try {
      const picked = await pickContactAsClient();
      if (!picked) return;
      setDisplayName(picked.display_name);
      if (picked.contact_name) setContactName(picked.contact_name);
      if (picked.email) setEmail(picked.email);
      if (picked.phone) setPhone(picked.phone);
      if (picked.address) setAddress(picked.address);
      if (picked.photo_uri) setPhotoUri(picked.photo_uri);
    } catch (err) {
      Alert.alert(t('Couldn’t Open Contacts'), err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setIsImporting(false);
    }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('Photo Access Needed'), t('Allow photo access in the Settings app to add a client photo.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setIsUploading(true);
    try {
      const persistedUri = await persistPickedFile(result.assets[0].uri, 'client-photos', `${newId()}.jpg`);
      setPhotoUri(persistedUri);
    } catch (err) {
      Alert.alert(t('Couldn’t Add Photo'), err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <FormScrollView>
      <View className="items-center gap-1 pb-4">
        <Avatar name={displayName || t('New Client')} photoUri={photoUri} size={96} />
        <Button label={photoUri ? t('Edit Photo') : t('Add Photo')} variant="plain" size="small" loading={isUploading} onPress={pickPhoto} />
      </View>

      {initial ? null : (
        <ListSection footer={t('Fills in the name, email, phone and address from someone in your contacts.')}>
          <ListRow
            icon="person.badge.plus"
            title={t('Fill from Contacts')}
            onPress={isImporting ? undefined : importFromContacts}
            trailing={isImporting ? <ActivityIndicator accessibilityLabel={t('Opening Contacts')} /> : undefined}
            accessory="none"
          />
        </ListSection>
      )}

      <ListSection>
        <FormRow
          label={t('Name')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('Business or person')}
          maxLength={100}
          textContentType="organizationName"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => contactRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormRow
          ref={contactRef}
          label={t('Contact')}
          value={contactName}
          onChangeText={setContactName}
          placeholder={t('Optional')}
          maxLength={100}
          textContentType="name"
          autoComplete="name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
      </ListSection>

      <ListSection>
        <FormRow
          ref={emailRef}
          label={t('Email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('name@example.com')}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={150}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          submitBehavior="submit"
        />
        <FormRow
          ref={phoneRef}
          label={t('Phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('Optional')}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={30}
        />
        <FormRow
          label={t('Address')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('Optional')}
          multiline
          textContentType="fullStreetAddress"
          autoComplete="street-address"
          maxLength={500}
        />
      </ListSection>

      <ListSection footer={t('Notes are only for you; they never appear on documents.')}>
        <FormRow
          label={t('Tax / VAT No.')}
          value={taxRegNumber}
          onChangeText={setTaxRegNumber}
          placeholder={t('Optional')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={50}
        />
        <FormRow label={t('Notes')} value={notes} onChangeText={setNotes} placeholder={t('Optional')} multiline maxLength={500} />
      </ListSection>
      {footer}
    </FormScrollView>
  );
}
