import type { DiscountType } from '../types/models';

/** All money in this app is an integer count of minor units (cents). Never use floats for currency math. */

export function formatMinor(minor: number, currencyCode: string, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(minor / 100);
}

/** Parses a user-typed amount string (e.g. "12.5") into integer minor units. Returns 0 for invalid input. */
export function parseToMinor(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function minorToDecimalString(minor: number): string {
  return (minor / 100).toFixed(2);
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
