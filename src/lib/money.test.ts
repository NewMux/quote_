import {
  applyDiscount,
  applyTaxBp,
  formatRateBp,
  getCurrencyDecimals,
  getCurrencySymbol,
  minorToDecimalString,
  parseRateBp,
  parseToMinor,
} from './money';

describe('getCurrencyDecimals', () => {
  it('returns 2 for USD', () => {
    expect(getCurrencyDecimals('USD')).toBe(2);
  });

  it('returns 0 for JPY (no minor unit)', () => {
    expect(getCurrencyDecimals('JPY')).toBe(0);
  });

  it('returns 3 for KWD (three-decimal currency)', () => {
    expect(getCurrencyDecimals('KWD')).toBe(3);
  });

  it('falls back to 2 for an unrecognized code', () => {
    expect(getCurrencyDecimals('NOTACODE')).toBe(2);
  });
});

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('falls back to the code itself for an unrecognized code', () => {
    expect(getCurrencySymbol('NOTACODE')).toBe('NOTACODE');
  });
});

describe('parseToMinor', () => {
  it('parses a plain decimal amount for a 2-decimal currency', () => {
    expect(parseToMinor('12.50', 'USD')).toBe(1250);
  });

  it('parses a whole number', () => {
    expect(parseToMinor('100', 'USD')).toBe(10000);
  });

  it('strips currency symbols and other non-numeric characters', () => {
    expect(parseToMinor('$1,234.56'.replace(/,/g, ''), 'USD')).toBe(123456);
  });

  it('ignores a minus sign, since input is stripped to digits and "."', () => {
    expect(parseToMinor('-50.00', 'USD')).toBe(5000);
  });

  it('returns 0 for empty input', () => {
    expect(parseToMinor('', 'USD')).toBe(0);
  });

  it('returns 0 for input with no digits', () => {
    expect(parseToMinor('abc', 'USD')).toBe(0);
  });

  it('scales correctly for a 0-decimal currency (JPY)', () => {
    expect(parseToMinor('500', 'JPY')).toBe(500);
  });

  it('scales correctly for a 3-decimal currency (KWD)', () => {
    expect(parseToMinor('1.500', 'KWD')).toBe(1500);
  });

  it('rounds fractional minor units rather than truncating', () => {
    // 0.005 * 100 = 0.5 -> rounds to 1, not 0
    expect(parseToMinor('0.005', 'USD')).toBe(1);
  });
});

describe('minorToDecimalString', () => {
  it('formats minor units back to a decimal string for USD', () => {
    expect(minorToDecimalString(1250, 'USD')).toBe('12.50');
  });

  it('formats correctly for a 0-decimal currency', () => {
    expect(minorToDecimalString(500, 'JPY')).toBe('500');
  });

  it('round-trips with parseToMinor for a typical amount', () => {
    const original = '42.99';
    expect(minorToDecimalString(parseToMinor(original, 'USD'), 'USD')).toBe(original);
  });
});

describe('applyDiscount', () => {
  it('returns 0 when no discount type is set', () => {
    expect(applyDiscount(10000, null, null)).toBe(0);
  });

  it('returns 0 when discount value is 0', () => {
    expect(applyDiscount(10000, 'percent', 0)).toBe(0);
  });

  it('computes a percent discount from basis points', () => {
    // 1500 bp = 15% of 10000 = 1500
    expect(applyDiscount(10000, 'percent', 1500)).toBe(1500);
  });

  it('computes a fixed-minor discount', () => {
    expect(applyDiscount(10000, 'fixed', 2000)).toBe(2000);
  });

  it('clamps a fixed discount at the base amount, never going negative', () => {
    expect(applyDiscount(1000, 'fixed', 5000)).toBe(1000);
  });

  it('rounds a percent discount to the nearest minor unit', () => {
    // 333 bp of 10000 = 333, exact; use an amount that doesn't divide evenly
    expect(applyDiscount(999, 'percent', 1500)).toBe(150); // 149.85 -> 150
  });
});

describe('applyTaxBp', () => {
  it('computes tax from basis points', () => {
    // 800 bp = 8% of 10000 = 800
    expect(applyTaxBp(10000, 800)).toBe(800);
  });

  it('returns 0 for a 0 rate', () => {
    expect(applyTaxBp(10000, 0)).toBe(0);
  });

  it('rounds to the nearest minor unit', () => {
    expect(applyTaxBp(999, 800)).toBe(80); // 79.92 -> 80
  });
});

describe('formatRateBp', () => {
  it('formats whole-percent basis points', () => {
    expect(formatRateBp(1500)).toBe('15.00%');
  });

  it('formats fractional-percent basis points', () => {
    expect(formatRateBp(875)).toBe('8.75%');
  });

  it('formats a 0 rate', () => {
    expect(formatRateBp(0)).toBe('0.00%');
  });
});

describe('parseRateBp', () => {
  it('parses a whole percent into basis points', () => {
    expect(parseRateBp('15')).toBe(1500);
  });

  it('parses a fractional percent into basis points', () => {
    expect(parseRateBp('8.75')).toBe(875);
  });

  it('returns 0 for empty input', () => {
    expect(parseRateBp('')).toBe(0);
  });

  it('round-trips with formatRateBp for a typical rate', () => {
    expect(parseRateBp(formatRateBp(1234).replace('%', ''))).toBe(1234);
  });
});
