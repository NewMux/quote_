import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useBusinessProfileStore } from '../../src/stores/useBusinessProfileStore';

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

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Field label="Estimate Prefix" value={estimatePrefix} onChangeText={setEstimatePrefix} />
      <Field label="Invoice Prefix" value={invoicePrefix} onChangeText={setInvoicePrefix} />
      <Field label="Number Padding (digits)" value={padding} onChangeText={setPadding} keyboardType="number-pad" />
      <Field
        label="Default Payment Terms (days)"
        value={paymentTermsDays}
        onChangeText={setPaymentTermsDays}
        keyboardType="number-pad"
      />

      <View className="flex-row items-center justify-between bg-white rounded-lg border border-gray-300 px-3 py-3">
        <Text className="text-base text-gray-900">Reset numbering yearly</Text>
        <Switch value={resetYearly} onValueChange={setResetYearly} />
      </View>

      <Pressable onPress={handleSave} disabled={isSaving} className="bg-blue-600 rounded-lg py-3 items-center">
        <Text className="text-white font-semibold">{isSaving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
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
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
