import type { ReactNode } from 'react';
import { View } from 'react-native';

interface SheetScreenProps {
  /** Usually a SheetHeader. */
  header: ReactNode;
  children: ReactNode;
}

/** The layout for every formSheet screen: the header, then the body filling the rest of the sheet.
 *
 * Both views are explicitly non-collapsable. react-native-screens looks for a ScrollView among a
 * sheet's direct children and, when it finds one, sizes and positions it itself — on iOS 26 that
 * put the ScrollView at the top of the sheet, covering our header. Keeping the body in its own
 * real view means our flex layout, not the library, places the scroll content under the header. */
export function SheetScreen({ header, children }: SheetScreenProps) {
  return (
    <View className="flex-1 bg-grouped" collapsable={false}>
      {header}
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </View>
  );
}
