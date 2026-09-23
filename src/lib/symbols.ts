import type { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Every SF Symbol the app draws, with the Ionicons glyph that stands in for it where SF Symbols
 * aren't available (Android, web). Keeping them in one table means a symbol can't be used without a
 * fallback. */
export const SYMBOL_FALLBACKS = {
  // Tabs
  house: 'home-outline',
  'house.fill': 'home',
  'doc.text': 'document-text-outline',
  'doc.text.fill': 'document-text',
  'person.2': 'people-outline',
  'person.2.fill': 'people',
  gearshape: 'settings-outline',
  'gearshape.fill': 'settings',

  // Actions
  plus: 'add',
  'plus.circle.fill': 'add-circle',
  pencil: 'pencil',
  'square.and.arrow.up': 'share-outline',
  'square.and.arrow.up.fill': 'share',
  'arrow.left.arrow.right': 'swap-horizontal',
  trash: 'trash-outline',
  'trash.fill': 'trash',
  archivebox: 'archive-outline',
  'archivebox.fill': 'archive',
  'minus.circle.fill': 'remove-circle',
  'xmark.circle.fill': 'close-circle',
  magnifyingglass: 'search',
  'line.3.horizontal.decrease.circle': 'filter-circle-outline',
  'line.3.horizontal.decrease.circle.fill': 'filter-circle',
  'ellipsis.circle': 'ellipsis-horizontal-circle-outline',
  'person.badge.plus': 'person-add',
  'square.and.pencil': 'create-outline',

  // Accessories
  'chevron.right': 'chevron-forward',
  checkmark: 'checkmark',
  'checkmark.circle.fill': 'checkmark-circle',
  circle: 'ellipse-outline',

  // Status
  'clock.fill': 'time',
  'exclamationmark.circle.fill': 'alert-circle',
  'exclamationmark.triangle.fill': 'warning',
  'pencil.circle.fill': 'create',
  'xmark.octagon.fill': 'close-circle',
  'arrow.triangle.2.circlepath': 'sync',

  // Objects
  'doc.plaintext': 'document-outline',
  'doc.plaintext.fill': 'document',
  'doc.on.doc.fill': 'documents',
  banknote: 'cash-outline',
  'banknote.fill': 'cash',
  calendar: 'calendar-outline',
  repeat: 'repeat',
  photo: 'image-outline',
  'person.crop.circle.fill': 'person-circle',
  'person.fill': 'person',
  'star.fill': 'star',
  'building.2.fill': 'business',
  tag: 'pricetag-outline',
  'tag.fill': 'pricetag',
  percent: 'calculator',
  number: 'list',
  'bell.fill': 'notifications',
  'bell.badge.fill': 'notifications',
  'hand.raised.fill': 'shield-checkmark',
  signature: 'create-outline',
  'envelope.fill': 'mail',
  'phone.fill': 'call',
  'lock.fill': 'lock-closed',
  'chart.bar.fill': 'bar-chart',
  'crown.fill': 'ribbon',
  tray: 'file-tray-outline',
} as const satisfies Record<string, IoniconName>;

export type SymbolName = keyof typeof SYMBOL_FALLBACKS;

export function fallbackIcon(name: SymbolName): IoniconName {
  return SYMBOL_FALLBACKS[name];
}
