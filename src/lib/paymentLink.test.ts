import { normalizePaymentLink, resolvePaymentLink } from './paymentLink';

describe('normalizePaymentLink', () => {
  it('returns null for empty input', () => {
    expect(normalizePaymentLink('')).toBeNull();
    expect(normalizePaymentLink('   ')).toBeNull();
    expect(normalizePaymentLink(null)).toBeNull();
  });

  it('adds https:// when no scheme is given', () => {
    expect(normalizePaymentLink('paypal.me/northwind')).toBe('https://paypal.me/northwind');
  });

  it('keeps http and https links as typed, trimmed', () => {
    expect(normalizePaymentLink('  https://buy.stripe.com/abc123 ')).toBe('https://buy.stripe.com/abc123');
    expect(normalizePaymentLink('http://pay.example.com/x')).toBe('http://pay.example.com/x');
  });

  it('rejects other schemes and non-URLs', () => {
    expect(normalizePaymentLink('javascript:alert(1)')).toBeNull();
    expect(normalizePaymentLink('mailto:me@example.com')).toBeNull();
    expect(normalizePaymentLink('not a link')).toBeNull();
    expect(normalizePaymentLink('localhost')).toBeNull();
  });
});

describe('resolvePaymentLink', () => {
  const ctx = { amountMinor: 429000, currencyCode: 'USD', docNumber: 'INV-0042' };

  it('returns null when there is no link', () => {
    expect(resolvePaymentLink(null, ctx)).toBeNull();
  });

  it('returns a link without placeholders unchanged', () => {
    expect(resolvePaymentLink('https://buy.stripe.com/abc', ctx)).toBe('https://buy.stripe.com/abc');
  });

  it('fills {amount}, {currency} and {number}', () => {
    expect(resolvePaymentLink('paypal.me/northwind/{amount}{currency}?ref={number}', ctx)).toBe(
      'https://paypal.me/northwind/4290.00USD?ref=INV-0042'
    );
  });

  it('uses the currency’s own decimals', () => {
    expect(resolvePaymentLink('https://pay.example.com/{amount}', { ...ctx, amountMinor: 12500, currencyCode: 'JPY' })).toBe(
      'https://pay.example.com/12500'
    );
    expect(resolvePaymentLink('https://pay.example.com/{amount}', { ...ctx, amountMinor: 12500, currencyCode: 'BHD' })).toBe(
      'https://pay.example.com/12.500'
    );
  });

  it('URL-encodes document numbers', () => {
    expect(resolvePaymentLink('https://pay.example.com/?n={number}', { ...ctx, docNumber: 'INV 2026/1' })).toBe(
      'https://pay.example.com/?n=INV%202026%2F1'
    );
  });

  it('never requests a negative amount', () => {
    expect(resolvePaymentLink('https://p.example.com/{amount}', { ...ctx, amountMinor: -500 })).toBe('https://p.example.com/0.00');
  });
});
