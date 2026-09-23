import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { GROUPED_RADIUS } from './list/ListSection';

interface GroupedCardProps {
  header?: string;
  footer?: string;
  children: ReactNode;
}

/** Free-form content (a chart, a summary) in the same inset-grouped card as a ListSection, so it
 * sits in the list's rhythm instead of floating as a shadowed card. */
export function GroupedCard({ header, footer, children }: GroupedCardProps) {
  return (
    <View className="mb-8">
      {header ? (
        <Text className="text-footnote text-secondary px-4 mb-2" accessibilityRole="header">
          {header}
        </Text>
      ) : null}
      <View className="bg-card p-4" style={{ borderRadius: GROUPED_RADIUS, borderCurve: 'continuous' }}>
        {children}
      </View>
      {footer ? <Text className="text-footnote text-secondary px-4 mt-2">{footer}</Text> : null}
    </View>
  );
}
