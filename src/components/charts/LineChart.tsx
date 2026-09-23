import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useThemeColors } from '../../lib/theme';
import type { ChartPoint } from '../../types/models';

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  /** Spoken summary for VoiceOver, e.g. "Paid by month: Jan, $1,200; …". */
  accessibilityLabel?: string;
}

/** At most this many x-axis labels are drawn so they never collide; the rest are skipped evenly. */
const MAX_LABELS = 6;

export function LineChart({ data, height = 140, color, accessibilityLabel }: LineChartProps) {
  const colors = useThemeColors();
  const lineColor = color ?? colors.tint;
  const width = 320;
  const paddingX = 12;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-sm text-secondary">No Data Yet</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth);
    const y = paddingY + chartHeight - ((d.value - min) / range) * chartHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`;

  const labelStep = Math.ceil(data.length / MAX_LABELS);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.25} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaFill)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={lineColor} />
        ))}
      </Svg>
      <View className="flex-row justify-between px-1">
        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <Text key={d.label} className="text-xs text-secondary" numberOfLines={1}>
              {d.label}
            </Text>
          ) : null
        )}
      </View>
    </View>
  );
}
