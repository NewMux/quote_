import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ROWS: Array<{ label: string; href: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { label: 'Business Profile', href: '/settings/business-profile', icon: 'business-outline' },
  { label: 'Tax Brackets', href: '/settings/tax-brackets', icon: 'calculator-outline' },
  { label: 'Document Numbering', href: '/settings/numbering', icon: 'list-outline' },
];

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      {ROWS.map((row) => (
        <Pressable
          key={row.href}
          onPress={() => router.push(row.href as never)}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 border border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name={row.icon} size={20} color="#374151" />
            <Text className="text-base text-gray-900">{row.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      ))}
    </View>
  );
}
