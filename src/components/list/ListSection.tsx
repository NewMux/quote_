import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ListSectionProps {
  header?: string;
  footer?: string;
  children: ReactNode;
}

/** Corner radius of inset-grouped cards, matching iOS 26's rounder lists. */
export const GROUPED_RADIUS = 26;

/** An iOS inset-grouped section: optional header, a rounded card of rows separated by inset
 * hairlines, and an optional footer explaining the section. */
export function ListSection({ header, footer, children }: ListSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{ showSeparator?: boolean }>[];
  return (
    <View className="mb-8">
      {header ? (
        <Text className="text-footnote text-secondary px-4 mb-2" accessibilityRole="header">
          {header}
        </Text>
      ) : null}
      <View
        className="bg-card overflow-hidden"
        style={{ borderRadius: GROUPED_RADIUS, borderCurve: 'continuous' }}
      >
        {rows.map((row, index) => cloneElement(row, { showSeparator: index > 0 }))}
      </View>
      {footer ? <Text className="text-footnote text-secondary px-4 mt-2">{footer}</Text> : null}
    </View>
  );
}
