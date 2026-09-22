import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../src/components/Card';
import { ScreenHeader } from '../../../src/components/ScreenHeader';

const ROWS: Array<{ label: string; subtitle: string; href: string; icon: keyof typeof Ionicons.glyphMap }> = [
  {
    label: 'Business Profile',
    subtitle: 'Your business name, logo, and contact info',
    href: '/settings/business-profile',
    icon: 'business-outline',
  },
  {
    label: 'Item Catalog',
    subtitle: 'Save items or services you bill often',
    href: '/settings/items',
    icon: 'pricetags-outline',
  },
  {
    label: 'Tax Rates',
    subtitle: 'Sales tax or VAT rates you can add to items',
    href: '/settings/tax-brackets',
    icon: 'calculator-outline',
  },
  {
    label: 'Invoice & Estimate Numbers',
    subtitle: 'How your invoice and estimate numbers are formatted',
    href: '/settings/numbering',
    icon: 'list-outline',
  },
  {
    label: 'Privacy Policy',
    subtitle: 'What this app stores and how it uses it',
    href: '/settings/privacy-policy',
    icon: 'shield-checkmark-outline',
  },
];

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Settings" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Card className="p-0 overflow-hidden">
          {ROWS.map((row, index) => (
            <Pressable key={row.href} onPress={() => router.push(row.href as never)}>
              <View
                className={`flex-row items-center justify-between p-4 ${
                  index < ROWS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Ionicons name={row.icon} size={20} color="#374151" />
                  <View className="flex-1">
                    <Text className="text-base text-gray-900">{row.label}</Text>
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                      {row.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </Pressable>
          ))}
        </Card>

        <Pressable onPress={() => router.push('/settings/delete-data')}>
          <View className="bg-red-50 rounded-2xl p-4 mt-6 flex-row items-center justify-between border border-red-100">
            <View className="flex-row items-center gap-3 flex-1">
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <View className="flex-1">
                <Text className="text-base text-red-600 font-medium">Delete All Data</Text>
                <Text className="text-xs text-red-400" numberOfLines={1}>
                  Permanently erase everything stored on this device
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#F87171" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
