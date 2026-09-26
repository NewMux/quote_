import { minorToDecimalString } from './money';

/** Normalizes a pasted payment link: trims it, adds https:// when no scheme was typed, and
 * returns null for anything that isn't an http(s) URL (so a stray "javascript:" or mailto link
 * never reaches a PDF). */
export function normalizePaymentLink(input: string | null | undefined): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!/^https?:\/\/[^\s/]+\.[^\s]+/i.test(withScheme)) return null;
  if (/\s/.test(withScheme)) return null;
  return withScheme;
}

export interface PaymentLinkContext {
  amountMinor: number;
  currencyCode: string;
  docNumber: string;
}

/** Fills a payment link template for one invoice. {amount} becomes a plain decimal ("4290.00"),
 * {currency} the ISO code and {number} the document number, each URL-encoded, so links like
 * paypal.me/northwind/{amount} request the right sum. */
export function resolvePaymentLink(template: string | null | undefined, ctx: PaymentLinkContext): string | null {
  const link = normalizePaymentLink(template);
  if (!link) return null;
  return link
    .replace(/\{amount\}/gi, encodeURIComponent(minorToDecimalString(Math.max(0, ctx.amountMinor), ctx.currencyCode)))
    .replace(/\{currency\}/gi, encodeURIComponent(ctx.currencyCode))
    .replace(/\{number\}/gi, encodeURIComponent(ctx.docNumber));
}
