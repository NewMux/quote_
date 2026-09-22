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
        The business info you enter in Business Profile, the clients and items you add, the
        invoices and estimates you create, and any signatures, photos, or payment records you
        attach to them.
      </Section>
      <Section title="Where it's stored">
        Everything is saved in a database and file storage on this device only — nothing is
        uploaded anywhere. There is no account, no sign-in, and no cloud sync.
      </Section>
      <Section title="What this app doesn't do">
        This app makes no network requests of any kind. There's no analytics, no advertising, no
        tracking, and your data is never shared with or sold to anyone — because it never leaves
        your device in the first place. Sharing a PDF or emailing an invoice is something you
        choose to do, using your own device's share sheet or mail app.
      </Section>
      <Section title="Deleting your data">
        You can permanently erase everything this app has stored — all clients, documents, items,
        tax rates, signatures, and payment records — from Settings → Delete All Data.
      </Section>
    </ScrollView>
  );
}
