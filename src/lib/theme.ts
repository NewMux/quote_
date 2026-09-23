import { useColorScheme } from 'react-native';
import { vars } from 'nativewind';

/** Brand hues that stay the same in light and dark mode (gradients, filled buttons — white text on
 * `default` is 5.3:1). For text and icons that sit on a background, use the adaptive `tint` from
 * `useThemeColors()` instead, which brightens in dark mode to stay legible on black. */
export const BRAND = {
  default: '#157A63',
  dark: '#0F3D3A',
  darker: '#0B2B27',
  mint: '#8FE3C0',
} as const;

/** Semantic colors, modelled on iOS system colors. Every screen styles itself with these (as
 * Tailwind classes like `bg-card` / `text-label`, or via `useThemeColors()`), so the whole app
 * follows the system Light/Dark setting. Text colors meet 4.5:1 on their backgrounds in both modes. */
const light = {
  background: '#FFFFFF',
  grouped: '#F2F2F7',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  fill: '#E9E9EE',
  secondaryFill: '#EFEFF0',
  label: '#111827',
  secondary: '#5F6368',
  tertiary: '#8A8A8E',
  placeholder: '#8E8E93',
  chevron: '#B8B8BD',
  separator: '#E5E5EA',
  field: '#D1D1D6',
  tint: '#157A63',
  brand: '#157A63',
  brandDark: '#0F3D3A',
  destructive: '#D70015',
  warning: '#B45309',
  info: '#1D6FD8',
  success: '#1B8A55',
};

const dark: typeof light = {
  background: '#000000',
  grouped: '#000000',
  card: '#1C1C1E',
  elevated: '#2C2C2E',
  fill: '#3A3A3C',
  secondaryFill: '#2C2C30',
  label: '#FFFFFF',
  secondary: '#AEAEB2',
  tertiary: '#8D8D93',
  placeholder: '#8E8E93',
  chevron: '#5A5A5E',
  separator: '#38383A',
  field: '#48484A',
  tint: '#4CD3A5',
  brand: '#157A63',
  brandDark: '#0F3D3A',
  destructive: '#FF6961',
  warning: '#F5A623',
  info: '#5AA9FF',
  success: '#5FD897',
};

export type ThemeColors = typeof light;
export const THEME_COLORS = { light, dark } as const;

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

function toRgbTriplet(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function toCssVars(colors: ThemeColors) {
  return vars(
    Object.fromEntries(
      Object.entries(colors).map(([name, hex]) => [`--color-${name}`, toRgbTriplet(hex)])
    )
  );
}

/** Applied by the root layout: NativeWind reads the Tailwind color tokens from these variables. */
export const THEME_VARS = { light: toCssVars(light), dark: toCssVars(dark) } as const;

/** Status badge background/foreground pairs; the text always states the status too, so meaning
 * never depends on color alone. */
const STATUS_LIGHT = {
  draft: { bg: '#EEF1F0', fg: '#4B5563' },
  issued: { bg: '#FDECC8', fg: '#8A5A06' },
  partially_paid: { bg: '#FCE4C4', fg: '#A14B08' },
  paid: { bg: '#DFF6E8', fg: '#17784A' },
  overdue: { bg: '#FCE2E2', fg: '#B3261E' },
  void: { bg: '#EEF1F0', fg: '#4B5563' },
} as const;

const STATUS_DARK: Record<keyof typeof STATUS_LIGHT, { bg: string; fg: string }> = {
  draft: { bg: '#2C2C2E', fg: '#C7C7CC' },
  issued: { bg: '#3A2E12', fg: '#F5C063' },
  partially_paid: { bg: '#3B2410', fg: '#FDBA74' },
  paid: { bg: '#0F2E1E', fg: '#5FD897' },
  overdue: { bg: '#3A1413', fg: '#FF8A80' },
  void: { bg: '#2C2C2E', fg: '#C7C7CC' },
};

export function useStatusColors() {
  return useColorScheme() === 'dark' ? STATUS_DARK : STATUS_LIGHT;
}

/** Swipe-action backgrounds. Fixed in both appearances (like iOS's own swipe actions); each keeps
 * its white semibold label at 4.5:1 or better. */
export const SWIPE_COLORS = {
  share: '#1D6FD8',
  convert: '#157A63',
  payment: '#17784A',
  edit: '#5F6368',
  archive: '#B45309',
  delete: '#D70015',
} as const;

/** A small fixed palette to deterministically color initials avatars. Each keeps white initials
 * at 4.5:1 or better, and reads on both light and dark backgrounds. */
export const AVATAR_PALETTE = [
  '#157A63',
  '#A14B08',
  '#1D5FC4',
  '#6D3FD1',
  '#B3261E',
  '#0B6E8A',
  '#7A5A06',
  '#4B5563',
] as const;
