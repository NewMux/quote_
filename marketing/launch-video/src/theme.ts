// Invoice Them's dark-mode palette, copied from the app's src/lib/theme.ts so the mockups match
// the real product.
export const C = {
  bg: '#000000',
  ink: '#050A09',
  card: '#1C1C1E',
  elevated: '#2C2C2E',
  fill: '#3A3A3C',
  label: '#FFFFFF',
  secondary: '#AEAEB2',
  tertiary: '#8D8D93',
  separator: '#38383A',
  tint: '#4CD3A5',
  brand: '#157A63',
  brandDark: '#0F3D3A',
  brandDarker: '#0B2B27',
  mint: '#8FE3C0',
  green: '#5FD897',
  orange: '#F5A623',
  red: '#FF6961',
  blue: '#5AA9FF',
  gray: '#8E8E93',
} as const;

export const FONT = 'Inter, -apple-system, system-ui, sans-serif';

export const GRADIENT_TEXT = {
  backgroundImage: `linear-gradient(100deg, ${C.mint} 0%, ${C.tint} 45%, #D9FFF0 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const;
