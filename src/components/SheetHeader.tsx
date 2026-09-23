import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { IS_IOS_26 } from '../lib/platform';
import type { SymbolName } from '../lib/symbols';
import { BRAND, useThemeColors } from '../lib/theme';
import { HeaderTextButton } from './HeaderTextButton';
import { Icon } from './Icon';

const HAS_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

interface SheetHeaderProps {
  title: string;
  /** Leading button; defaults to "Cancel", which dismisses the sheet. */
  closeLabel?: string;
  onClose?: () => void;
  /** Trailing confirming action (e.g. "Add", "Save", "Done"). */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

/** A round 44pt sheet button, as on iOS 26: a glass xmark to dismiss, a tinted checkmark to
 * confirm. The label is what VoiceOver reads. */
function RoundButton({
  symbol,
  label,
  onPress,
  prominent,
  disabled,
}: {
  symbol: SymbolName;
  label: string;
  onPress: () => void;
  prominent?: boolean;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const iconColor = prominent ? '#FFFFFF' : colors.label;
  const icon = <Icon name={symbol} size={17} weight="semibold" color={iconColor} />;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      {HAS_GLASS ? (
        <GlassView
          isInteractive
          tintColor={prominent ? BRAND.default : undefined}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </GlassView>
      ) : (
        <View className={`w-11 h-11 rounded-full items-center justify-center ${prominent ? 'bg-brand' : 'bg-secondaryfill'}`}>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

/** The navigation bar of a sheet, laid out the iOS way: dismiss on the leading edge, the confirming
 * action on the trailing edge, the title centered between them. iOS 26 uses round symbol buttons;
 * earlier iOS and Android use text buttons. */
export function SheetHeader({
  title,
  closeLabel = 'Cancel',
  onClose,
  actionLabel,
  onAction,
  actionDisabled,
}: SheetHeaderProps) {
  const close = onClose ?? (() => router.back());
  // A custom leading action (like "Reset") has no standard symbol, so it stays a text button.
  const useRoundClose = IS_IOS_26 && closeLabel === 'Cancel';
  return (
    <SafeAreaView edges={['top']} className="bg-grouped">
      <View className="flex-row items-center px-4 pt-3 pb-1.5 min-h-[60px]">
        <View className="flex-1 items-start">
          {useRoundClose ? (
            <RoundButton symbol="xmark" label={closeLabel} onPress={close} />
          ) : (
            <HeaderTextButton label={closeLabel} onPress={close} />
          )}
        </View>
        <Text
          className="text-headline font-semibold text-label text-center flex-shrink"
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <View className="flex-1 items-end">
          {actionLabel && onAction ? (
            IS_IOS_26 ? (
              <RoundButton
                symbol="checkmark"
                label={actionLabel}
                onPress={onAction}
                prominent
                disabled={actionDisabled}
              />
            ) : (
              <HeaderTextButton label={actionLabel} onPress={onAction} disabled={actionDisabled} prominent />
            )
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
