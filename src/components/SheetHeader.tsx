import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND } from '../lib/theme';

interface SheetHeaderProps {
  title: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function SheetHeader({ title, onClose, closeLabel = 'Cancel' }: SheetHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View style={{ width: 64 }}>
          <Pressable onPress={onClose ?? (() => router.back())} hitSlop={8}>
            <Text style={{ color: BRAND.default }} className="text-base">
              {closeLabel}
            </Text>
          </Pressable>
        </View>
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 64 }} />
      </View>
    </SafeAreaView>
  );
}
