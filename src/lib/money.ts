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

/** Parses a user-typed amount string (e.g. "12.5") into integer minor units, scaled for the
 * given currency's decimal precision. Returns 0 for invalid input. */
export function parseToMinor(input: string, currencyCode: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  const multiplier = 10 ** getCurrencyDecimals(currencyCode);
  return Math.round(value * multiplier);
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
    return Math.round((baseMinor * discountValue) / 10000);
  }
  return Math.min(discountValue, baseMinor);
}

/** Applies a tax rate in basis points (1500 = 15.00%) to a minor amount. */
export function applyTaxBp(baseMinor: number, rateBp: number): number {
  return Math.round((baseMinor * rateBp) / 10000);
}

export function formatRateBp(rateBp: number): string {
  return `${(rateBp / 100).toFixed(2)}%`;
}

export function parseRateBp(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}
