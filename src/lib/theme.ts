/** Raw hex values for places that can't use Tailwind classNames (SVG props, gradients,
 * inline styles). Keep in sync with the `brand`/`surface` tokens in tailwind.config.js. */
export const BRAND = {
  default: '#157A63',
  dark: '#0F3D3A',
  darker: '#0B2B27',
  mint: '#8FE3C0',
} as const;

export const SURFACE = '#F4F6F7';

export const STATUS_COLORS = {
  draft: { bg: '#EEF1F0', fg: '#4B5563' },
  issued: { bg: '#FDECC8', fg: '#92610B' },
  partially_paid: { bg: '#FCE4C4', fg: '#B45309' },
  paid: { bg: '#DFF6E8', fg: '#1B8A55' },
  overdue: { bg: '#FCE2E2', fg: '#C0392B' },
  void: { bg: '#EEF1F0', fg: '#4B5563' },
} as const;

/** A small fixed palette to deterministically color initials avatars. */
export const AVATAR_PALETTE = [
  '#157A63',
  '#B45309',
  '#2563EB',
  '#7C3AED',
  '#C0392B',
  '#0891B2',
  '#92610B',
  '#4B5563',
] as const;
