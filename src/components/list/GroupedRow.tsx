import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Wraps one row of a virtualized (FlatList) inset-grouped list, rounding the first and last rows so
 * the rows together read as one card — the FlatList counterpart of ListSection. */
export function GroupedRow({ index, count, children }: { index: number; count: number; children: ReactNode }) {
  const first = index === 0;
  const last = index === count - 1;
  return (
    <View className={`bg-card overflow-hidden ${first ? 'rounded-t-xl' : ''} ${last ? 'rounded-b-xl' : ''}`}>
      {children}
    </View>
  );
}
