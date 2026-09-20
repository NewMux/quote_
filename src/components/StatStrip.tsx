import { Text, View } from 'react-native';

export interface StatStripItem {
  label: string;
  value: string;
}

interface StatStripProps {
  items: StatStripItem[];
}

export function StatStrip({ items }: StatStripProps) {
  return (
    <View className="flex-row bg-brand-dark rounded-3xl px-2 py-4">
      {items.map((item, index) => (
        <View key={item.label} className={`flex-1 items-center ${index > 0 ? 'border-l border-white/15' : ''}`}>
          <Text className="text-white text-lg font-bold">{item.value}</Text>
          <Text className="text-white/60 text-xs mt-0.5">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
