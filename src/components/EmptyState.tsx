import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-base font-semibold text-gray-700 text-center">{title}</Text>
      {subtitle ? <Text className="text-sm text-gray-400 text-center mt-1">{subtitle}</Text> : null}
    </View>
  );
}
