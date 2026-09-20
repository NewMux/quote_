import { Text, View } from 'react-native';
import { BRAND } from '../../lib/theme';
import type { ChartPoint } from '../../types/models';

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 140, color = BRAND.default }: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-sm text-gray-400">No data yet</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ height }} className="flex-row items-end gap-2">
      {data.map((d) => {
        const barHeight = Math.max((d.value / max) * (height - 24), 4);
        return (
          <View key={d.label} className="flex-1 items-center">
            <View
              style={{ height: barHeight, backgroundColor: color }}
              className="w-full rounded-t-lg"
            />
            <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
