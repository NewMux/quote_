import { Pressable } from 'react-native';
import type { SymbolName } from '../lib/symbols';
import { Icon } from './Icon';
import { useThemeColors } from '../lib/theme';

interface HeaderButtonProps {
  icon: SymbolName;
  label: string;
  onPress: () => void;
  /** For toggles like an active filter: announced to VoiceOver as selected. */
  selected?: boolean;
}

/** A 44pt icon-only navigation bar button. On iOS, screens use native bar button items (see
 * src/lib/headerItems.ts); this is the Android fallback and the in-content equivalent. */
export function HeaderButton({ icon, label, onPress, selected }: HeaderButtonProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      className="w-11 h-11 items-center justify-center"
    >
      <Icon name={icon} size={22} color={colors.tint} />
    </Pressable>
  );
}
