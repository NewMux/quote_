import { ScrollView, Text, View } from 'react-native';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View className="mb-6">
      <Text className="text-base font-semibold text-gray-900 mb-2">{title}</Text>
      <Text className="text-sm text-gray-700 leading-5">{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      <Section title="What this app stores">
        The email address and password you sign up with, the business info you enter in Business
        Profile, the clients and items you add, the invoices and estimates you create, and any
        signatures, photos, or payment records you attach to them.
      </Section>
      <Section title="Where it's stored">
        Your data is stored in a secure cloud database and file storage (provided by Supabase),
        tied to your account. This lets you sign in and access your invoices and clients from more
        than one device, and means your data survives a lost or reset phone. Your business&apos;s
        records are kept private and isolated from every other business using this app — enforced
        at the database level, not just hidden in the app&apos;s interface.
      </Section>
      <Section title="What this app does and doesn't do">
        This app connects to the internet to save and sync your data. It doesn&apos;t run ads,
        sell your data, or share it with third parties, and it doesn&apos;t use analytics or
        tracking beyond what&apos;s needed to keep the app itself working correctly. Sharing a PDF
        or emailing an invoice is something you choose to do, using your own device&apos;s share
        sheet or mail app.
      </Section>
      <Section title="Deleting your data">
        Settings → Delete All Data permanently erases every client, document, item, tax rate,
        signature, and payment record, and resets your business profile — while keeping your
        account and login. Settings → Delete Account goes further: it deletes all of that and your
        account itself, signing you out for good.
      </Section>
    </ScrollView>
  );
}
