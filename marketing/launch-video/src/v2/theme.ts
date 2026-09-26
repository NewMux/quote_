// v2's palette: a bright, neutral stage where each feature brings its own color. Teal belongs to
// the app mark only; the finale switches to midnight.
export const L = {
  bg: '#F5F5F7',
  paper: '#FFFFFF',
  ink: '#111114',
  secondary: '#6E6E73',
  tertiary: '#A1A1A6',
  separator: '#E5E5EA',
  fill: '#EDEDF0',
} as const;

export const ACCENT = {
  blue: '#2F6BFF',
  orange: '#FF7A2F',
  violet: '#7B61FF',
  pink: '#FF4F8B',
  indigo: '#4B5BFF',
  red: '#FF3B30',
  green: '#34C759',
  yellow: '#FFCC00',
} as const;

export const NIGHT = {
  bg: '#0B0D17',
  ink: '#FFFFFF',
  secondary: '#A7A9BE',
  violet: '#7B61FF',
  coral: '#FF6B6B',
  blue: '#2F6BFF',
} as const;

/** iOS light-mode tokens (from the app's src/lib/theme.ts), for the phone mockups. */
export const IOS = {
  grouped: '#F2F2F7',
  card: '#FFFFFF',
  label: '#111827',
  secondary: '#5F6368',
  tertiary: '#8A8A8E',
  separator: '#E5E5EA',
  fill: '#E9E9EE',
  tint: '#157A63',
  brand: '#157A63',
  green: '#1B8A55',
  orange: '#B45309',
  red: '#D70015',
} as const;

export const SOFT_SHADOW = '0 50px 90px rgba(17,17,20,0.18), 0 12px 30px rgba(17,17,20,0.10)';
