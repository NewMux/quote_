import { format, parseISO } from 'date-fns';
import type { DocType, SettlementMethod } from '../types/models';
import { t } from './i18n';
import { dateLocale, datePattern } from './i18n/dates';

/** Display names for values stored as internal enums, so raw identifiers never reach the screen. */

export function docTypeLabel(docType: DocType): string {
  return docType === 'invoice' ? t('Invoice') : t('Estimate');
}

export function settlementMethodLabel(method: SettlementMethod): string {
  switch (method) {
    case 'cash':
      return t('Cash');
    case 'bank_transfer':
      return t('Bank Transfer');
    case 'check':
      return t('Check');
    case 'other':
      return t('Other');
    default:
      return method;
  }
}

/** Formats a stored date ("2026-09-01") or timestamp ("2026-09-01T10:15:00.000Z") as "Sep 1, 2026".
 * A plain date is read as local midnight, so the displayed day matches the stored one. */
export function formatDisplayDate(isoDateOrTimestamp: string): string {
  return format(parseISO(isoDateOrTimestamp), datePattern('MMM d, yyyy'), { locale: dateLocale() });
}

/** A compact date for list rows: "Sep 1" this year, "Sep 1, 2025" otherwise. */
export function formatShortDate(isoDateOrTimestamp: string, now: Date = new Date()): string {
  const date = parseISO(isoDateOrTimestamp);
  const pattern = date.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy';
  return format(date, datePattern(pattern), { locale: dateLocale() });
}

/** Converts a picked Date to the stored YYYY-MM-DD form using the device's local calendar day.
 * (toISOString() would convert to UTC first and save the previous day east of UTC.) */
export function toStoredDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
