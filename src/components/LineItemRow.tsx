import { Text, View } from 'react-native';
import { formatMinor } from '../lib/money';
import type { LineItem } from '../types/models';

interface LineItemRowProps {
  line: LineItem;
  currencyCode: string;
}

export function LineItemRow({ line, currencyCode }: LineItemRowProps) {
  return (
    <View className="flex-row justify-between py-2 border-b border-separator">
      <View className="flex-1 pr-3">
        <Text className="text-subhead text-label">{line.description}</Text>
        <Text className="text-subhead text-secondary">
          {line.quantity}
          {line.unit_label ? ` ${line.unit_label}` : ''} × {formatMinor(line.unit_price_minor, currencyCode)}
          {line.tax_rate_bp > 0 ? ` · tax ${(line.tax_rate_bp / 100).toFixed(2)}%` : ''}
        </Text>
      </View>
      <Text className="text-subhead font-medium text-label">{formatMinor(line.line_total_minor, currencyCode)}</Text>
    </View>
  );
}
