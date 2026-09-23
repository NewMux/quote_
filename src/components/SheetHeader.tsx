import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderTextButton } from './HeaderTextButton';

interface SheetHeaderProps {
  title: string;
  /** Leading button; defaults to "Cancel", which dismisses the sheet. */
  closeLabel?: string;
  onClose?: () => void;
  /** Trailing, bold confirming action (e.g. "Add", "Save", "Done"). */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

/** The navigation bar of a sheet, laid out the iOS way: dismiss on the leading edge, the confirming
 * action on the trailing edge, the title centered between them. */
export function SheetHeader({
  title,
  closeLabel = 'Cancel',
  onClose,
  actionLabel,
  onAction,
  actionDisabled,
}: SheetHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-grouped">
      <View className="flex-row items-center px-4 py-1.5 min-h-[56px]">
        <View className="flex-1 items-start">
          <HeaderTextButton label={closeLabel} onPress={onClose ?? (() => router.back())} />
        </View>
        <Text
          className="text-[17px] font-semibold text-label text-center flex-shrink"
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <View className="flex-1 items-end">
          {actionLabel && onAction ? (
            <HeaderTextButton label={actionLabel} onPress={onAction} disabled={actionDisabled} prominent />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
