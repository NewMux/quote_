import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ListSectionProps {
  header?: string;
  footer?: string;
  children: ReactNode;
}

/** An iOS inset-grouped section: optional header, a rounded card of rows separated by inset
 * hairlines, and an optional footer explaining the section. */
export function ListSection({ header, footer, children }: ListSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{ showSeparator?: boolean }>[];
  return (
    <View className="mb-7">
      {header ? (
        <Text className="text-sm text-secondary px-4 mb-1.5" accessibilityRole="header">
          {header}
        </Text>
      ) : null}
      <View className="bg-card rounded-xl overflow-hidden">
        {rows.map((row, index) => cloneElement(row, { showSeparator: index > 0 }))}
      </View>
      {footer ? <Text className="text-sm text-secondary px-4 mt-1.5">{footer}</Text> : null}
    </View>
  );
}
