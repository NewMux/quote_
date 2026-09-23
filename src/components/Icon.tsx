import { Platform, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView, type SymbolWeight } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import type { SFSymbol } from 'sf-symbols-typescript';
import { fallbackIcon, type SymbolName } from '../lib/symbols';
import { useThemeColors } from '../lib/theme';

// Compile-time check that every name in the fallback table is a real SF Symbol.
type AllNamesAreSFSymbols = SymbolName extends SFSymbol ? true : never;
const allNamesAreSFSymbols: AllNamesAreSFSymbols = true;
void allNamesAreSFSymbols;

interface IconProps {
  name: SymbolName;
  size?: number;
  /** Defaults to the app's tint color. */
  color?: ColorValue;
  weight?: SymbolWeight;
  /** Only for icons that stand alone as the sole content of a control; otherwise the icon is
   * decorative and hidden from VoiceOver. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** An SF Symbol on iOS, with a matching Ionicons glyph elsewhere. */
export function Icon({ name, size = 22, color, weight = 'regular', accessibilityLabel, style }: IconProps) {
  const colors = useThemeColors();
  const tint = color ?? colors.tint;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityLabel, accessibilityRole: 'image' as const }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  if (Platform.OS !== 'ios') {
    return (
      <Ionicons name={fallbackIcon(name)} size={size} color={tint as string} style={style as never} {...a11y} />
    );
  }

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={tint}
      weight={weight}
      style={[{ width: size, height: size }, style]}
      {...a11y}
    />
  );
}
