import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
}

/** A permanent, non-collapsing large-title-style header rendered entirely in JS. Used on the
 * tab root screens instead of native `headerLargeTitleEnabled`, which proved unreliable inside
 * this app's Stack-in-Tabs nesting (the large title would render as a stuck overlay on top of
 * list content instead of properly collapsing). Rendering our own header removes any dependency
 * on that native behavior. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-card border-b border-separator">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Text className="text-3xl font-bold text-label">{title}</Text>
        {right}
      </View>
    </SafeAreaView>
  );
}
