import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Button } from '../../../src/components/Button';
import { formatDocNumber } from '../../../src/lib/docNumber';
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

  async function handleSave() {
    setIsSaving(true);
    await update({
      estimate_prefix: estimatePrefix,
      invoice_prefix: invoicePrefix,
      number_padding: Math.max(1, Number.parseInt(padding, 10) || 3),
      reset_numbering_yearly: resetYearly ? 1 : 0,
      default_payment_terms_days: Math.max(0, Number.parseInt(paymentTermsDays, 10) || 0),
    });
    setIsSaving(false);
  }

  const previewPadding = Math.max(1, Number.parseInt(padding, 10) || 3);
  const previewYear = resetYearly ? new Date().getFullYear() : 0;
  const invoicePreview = formatDocNumber(invoicePrefix, 1, previewPadding, previewYear);
  const estimatePreview = formatDocNumber(estimatePrefix, 1, previewPadding, previewYear);

  return (
    <ScrollView className="flex-1 bg-grouped" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Field label="Estimate Prefix" value={estimatePrefix} onChangeText={setEstimatePrefix} />
      <Field label="Invoice Prefix" value={invoicePrefix} onChangeText={setInvoicePrefix} />
      <Field
        label="Minimum Digits (e.g. 001)"
        value={padding}
        onChangeText={setPadding}
        keyboardType="number-pad"
      />
      <Field
        label="Default Payment Terms (days)"
        value={paymentTermsDays}
        onChangeText={setPaymentTermsDays}
        keyboardType="number-pad"
      />

      <View className="bg-card rounded-lg border border-separator px-3 py-3 gap-1">
        <Text className="text-xs text-secondary">Next numbers will look like:</Text>
        <Text className="text-base font-semibold text-label">{estimatePreview}</Text>
        <Text className="text-base font-semibold text-label">{invoicePreview}</Text>
      </View>

      <View className="bg-card rounded-lg border border-field px-3 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-label">Start Over Each Year</Text>
          <Switch value={resetYearly} onValueChange={setResetYearly} />
        </View>
        <Text className="text-xs text-secondary mt-1">
          e.g. INV-001 becomes the first number again each January
        </Text>
      </View>

      <Button label={isSaving ? 'Saving…' : 'Save'} variant="filled" size="large" disabled={isSaving} onPress={handleSave} />
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'number-pad';
}) {
  return (
    <View>
      <Text className="text-xs text-secondary mb-1">{label}</Text>
      <TextInput
        className="border border-field rounded-lg px-3 py-2 bg-card text-base text-label"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
