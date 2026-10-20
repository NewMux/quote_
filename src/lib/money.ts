import type { DiscountType } from '../types/models';

/** All money in this app is an integer count of minor units, scaled by the currency's own
 * decimal precision (100 for USD/EUR-style, 1 for JPY-style, 1000 for KWD-style). Never use
 * floats for currency math. */

/** Number of decimal digits a currency uses (2 for USD, 0 for JPY, 3 for KWD, etc.), derived
 * from ICU via Intl rather than a hardcoded table. Falls back to 2 for an unrecognized code. */
export function getCurrencyDecimals(currencyCode: string): number {
  try {
    return (
      new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** The currency's symbol/short code as ICU would render it (e.g. "$", "¥", "KD"). */
export function getCurrencySymbol(currencyCode: string, locale = 'en-US'): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

export function formatMinor(minor: number, currencyCode: string, locale = 'en-US'): string {
  const divisor = 10 ** getCurrencyDecimals(currencyCode);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(minor / divisor);
}

/** Normalizes a typed number to plain "1234.5" form, accepting either "." or "," as the decimal
 * point — iOS and Android show "," on the decimal pad in most of Europe, Latin America, and
 * Indonesia. The last separator typed is the decimal point and earlier ones are digit grouping
 * ("1.234,50" and "1,234.50" are both 1234.50); one kind repeated with no other ("1.234.567") is
 * grouping only. Everything that isn't a digit or separator is dropped, minus signs included. */
export function normalizeDecimalInput(input: string): string {
  const cleaned = input.replace(/[^0-9.,]/g, '');
  const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  if (lastSeparator === -1) return cleaned;
  const separator = cleaned[lastSeparator];
  const other = separator === '.' ? ',' : '.';
  if (!cleaned.includes(other) && cleaned.split(separator).length > 2) {
    return cleaned.replace(/[.,]/g, '');
  }
  return `${cleaned.slice(0, lastSeparator).replace(/[.,]/g, '')}.${cleaned.slice(lastSeparator + 1)}`;
}

/** Parses a typed decimal number (see normalizeDecimalInput). Returns NaN when it has no digits. */
export function parseDecimalInput(input: string): number {
  const normalized = normalizeDecimalInput(input);
  return /\d/.test(normalized) ? Number(normalized) : Number.NaN;
}

/** Scales a typed decimal to an integer count of 10^-digits units, rounding half up. Works on the
 * digit string, so "1.005" at 2 digits is 101 (float math gives 100). */
function parseScaled(input: string, digits: number): number {
  const normalized = normalizeDecimalInput(input);
  if (!/\d/.test(normalized)) return 0;
  const [whole, fraction = ''] = normalized.split('.');
  const padded = (fraction + '0'.repeat(digits + 1)).slice(0, digits + 1);
  const scaled = Number((whole || '0') + padded.slice(0, digits));
  return padded[digits] >= '5' ? scaled + 1 : scaled;
}

/** Parses a user-typed amount string (e.g. "12.5" or "12,5") into integer minor units, scaled
 * for the given currency's decimal precision. Returns 0 for invalid input. */
export function parseToMinor(input: string, currencyCode: string): number {
  return parseScaled(input, getCurrencyDecimals(currencyCode));
}

export function minorToDecimalString(minor: number, currencyCode: string): string {
  const digits = getCurrencyDecimals(currencyCode);
  const divisor = 10 ** digits;
  return (minor / divisor).toFixed(digits);
}

/** Applies a percent (basis points) or fixed-minor discount to a minor amount, floored at 0. */
export function applyDiscount(
  baseMinor: number,
  discountType: DiscountType | null | undefined,
  discountValue: number | null | undefined
): number {
  if (!discountType || !discountValue) return 0;
  if (discountType === 'percent') {
    // Capped at 100%, so a typo like "150" can't drive a total negative.
    const bp = Math.min(Math.max(discountValue, 0), 10000);
    return Math.round((baseMinor * bp) / 10000);
  }
  return Math.min(Math.max(discountValue, 0), baseMinor);
}

/** Applies a tax rate in basis points (1500 = 15.00%) to a minor amount. */
export function applyTaxBp(baseMinor: number, rateBp: number): number {
  return Math.round((baseMinor * rateBp) / 10000);
}

export function formatRateBp(rateBp: number): string {
  return `${(rateBp / 100).toFixed(2)}%`;
}

/** Parses a typed percentage ("7.5" or "7,5") into basis points (750). */
export function parseRateBp(input: string): number {
  return parseScaled(input, 2);
}
