import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { ar } from './ar';

/** A small static translator. Screens write their English text in code and wrap it in `t()`; the
 * English text is also the lookup key, so a string with no translation falls back to English
 * instead of showing a key. The language is read once at launch: iOS and Android restart the app
 * when the system or per-app language changes, so nothing has to react to a change at runtime. */

export type Locale = 'en' | 'ar';

/** One entry per source string; a plural entry maps CLDR plural categories to text. */
export type Plural = Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many' | 'other', string>>;
export type Dictionary = Record<string, string | Plural>;

const DICTIONARIES: Record<Locale, Dictionary> = { en: {}, ar };

function detectLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode;
    return code === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

let current: Locale = detectLocale();

export function getLocale(): Locale {
  return current;
}

/** For tests; the app itself never switches language while running. */
export function setLocaleForTests(locale: Locale): void {
  current = locale;
}

/** True when the layout runs right to left. Follows the native direction, which the OS sets from
 * the app's language, so text and layout can't disagree. */
export function isRTL(): boolean {
  return I18nManager.isRTL;
}

function fill(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/** Translates `en`, replacing `{name}` placeholders from `params`. */
export function t(en: string, params?: Record<string, string | number>): string {
  const entry = DICTIONARIES[current][en];
  return fill(typeof entry === 'string' ? entry : en, params);
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

function categoryFor(count: number): keyof Plural {
  let rules = pluralRules.get(current);
  if (!rules) {
    rules = new Intl.PluralRules(current);
    pluralRules.set(current, rules);
  }
  return rules.select(count) as keyof Plural;
}

/** Picks the right form for `count` and fills `{count}` plus any `params`. `one` and `other` are
 * the English forms; `other` is also the lookup key. */
export function tp(
  count: number,
  one: string,
  other: string,
  params?: Record<string, string | number>
): string {
  const values = { count, ...params };
  const entry = DICTIONARIES[current][other];
  if (entry && typeof entry === 'object') {
    return fill(entry[categoryFor(count)] ?? entry.other ?? other, values);
  }
  return fill(count === 1 ? one : other, values);
}
