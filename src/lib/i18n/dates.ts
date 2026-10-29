import { ar as arLocale } from 'date-fns/locale/ar';
import type { Locale as DateFnsLocale } from 'date-fns';
import { getLocale } from './index';

/** date-fns locale for the current language (undefined keeps its English default). */
export function dateLocale(): DateFnsLocale | undefined {
  return getLocale() === 'ar' ? arLocale : undefined;
}

/** Arabic reads day, month, year ("1 سبتمبر 2026"), so the day moves ahead of the month. Digits
 * stay Western either way, matching the amounts. */
export function datePattern(englishPattern: string): string {
  if (getLocale() !== 'ar') return englishPattern;
  return englishPattern.replace(/^MMM d(, yyyy)?$/, (_m, year) => (year ? 'd MMM yyyy' : 'd MMM'));
}
