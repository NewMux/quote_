import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

interface FormScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

/** The scroll container for every form: it keeps the focused field above the keyboard, lets a tap on
 * a button register on the first touch (instead of only dismissing the keyboard), and lets people
 * swipe the keyboard away. */
export function FormScrollView({ children, contentContainerStyle, ...rest }: FormScrollViewProps) {
  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={[{ padding: 16, gap: 20, paddingBottom: 40 }, contentContainerStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
