import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { FormField } from '../../../src/components/form/FormField';
import { FormScrollView } from '../../../src/components/form/FormScrollView';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { formatDocNumber } from '../../../src/lib/docNumber';
import { useSaveHeader } from '../../../src/lib/useSaveHeader';
import { useUnsavedChangesGuard } from '../../../src/lib/useUnsavedChangesGuard';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';

export default function NumberingScreen() {
  const { profile, load, update } = useBusinessProfileStore();
  const [estimatePrefix, setEstimatePrefix] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [padding, setPadding] = useState('3');
  const [resetYearly, setResetYearly] = useState(false);
  const [paymentTermsDays, setPaymentTermsDays] = useState('14');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile) return;
    setEstimatePrefix(profile.estimate_prefix);
    setInvoicePrefix(profile.invoice_prefix);
    setPadding(String(profile.number_padding));
    setResetYearly(profile.reset_numbering_yearly === 1);
    setPaymentTermsDays(String(profile.default_payment_terms_days));
  }, [profile]);

  const paddingValue = Math.min(8, Math.max(1, Number.parseInt(padding, 10) || 3));
  const termsValue = Math.max(0, Number.parseInt(paymentTermsDays, 10) || 0);
  const isDirty =
    !!profile &&
    (estimatePrefix !== profile.estimate_prefix ||
      invoicePrefix !== profile.invoice_prefix ||
      paddingValue !== profile.number_padding ||
      (resetYearly ? 1 : 0) !== profile.reset_numbering_yearly ||
      termsValue !== profile.default_payment_terms_days);
  const leave = useUnsavedChangesGuard(isDirty && !isSaving);

  async function handleSave() {
    setIsSaving(true);
    try {
      await update({
        estimate_prefix: estimatePrefix,
        invoice_prefix: invoicePrefix,
        number_padding: paddingValue,
        reset_numbering_yearly: resetYearly ? 1 : 0,
        default_payment_terms_days: termsValue,
      });
      leave(() => router.back());
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Settings', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  useSaveHeader({ onSave: handleSave, disabled: !isDirty || isSaving });

  const previewYear = resetYearly ? new Date().getFullYear() : 0;
  const invoicePreview = formatDocNumber(invoicePrefix, 1, paddingValue, previewYear);
  const estimatePreview = formatDocNumber(estimatePrefix, 1, paddingValue, previewYear);

  return (
    <FormScrollView>
      <View>
        <ListSection header="Preview" footer="How the next new numbers will look.">
          <ListRow title="Estimate" value={estimatePreview} />
          <ListRow title="Invoice" value={invoicePreview} />
        </ListSection>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Estimate Prefix"
            value={estimatePrefix}
            onChangeText={setEstimatePrefix}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Invoice Prefix"
            value={invoicePrefix}
            onChangeText={setInvoicePrefix}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
      </View>

      <FormField
        label="Minimum Digits"
        hint="3 gives numbers like 001."
        value={padding}
        onChangeText={setPadding}
        keyboardType="number-pad"
        maxLength={1}
      />

      <View>
        <ListSection footer="Numbering restarts at 1 every January, and the year is added, like INV-2026-001.">
          <ListRow title="Start Over Each Year" switchValue={resetYearly} onSwitchChange={setResetYearly} />
        </ListSection>
      </View>

      <FormField
        label="Payment Due After (Days)"
        hint="Sets the due date on new invoices."
        value={paymentTermsDays}
        onChangeText={setPaymentTermsDays}
        keyboardType="number-pad"
        maxLength={3}
      />
    </FormScrollView>
  );
}
