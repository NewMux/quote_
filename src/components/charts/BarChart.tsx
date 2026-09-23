import { Text, View } from 'react-native';
import { useThemeColors } from '../../lib/theme';
import type { ChartPoint } from '../../types/models';

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  /** Spoken summary for VoiceOver, e.g. "Paid by week: Sep 1, $1,200; …". */
  accessibilityLabel?: string;
}

export function BarChart({ data, height = 140, color, accessibilityLabel }: BarChartProps) {
  const colors = useThemeColors();
  const barColor = color ?? colors.tint;

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-sm text-secondary">No Data Yet</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View
      style={{ height }}
      className="flex-row items-end gap-2"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {data.map((d) => {
        // Zero stays a hairline so an empty period never reads as a small amount.
        const barHeight = d.value > 0 ? Math.max((d.value / max) * (height - 24), 4) : 1;
        return (
          <View key={d.label} className="flex-1 items-center">
            <View
              style={{ height: barHeight, backgroundColor: d.value > 0 ? barColor : colors.separator }}
              className="w-full rounded-t-lg"
            />
            <Text className="text-xs text-secondary mt-1" numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
