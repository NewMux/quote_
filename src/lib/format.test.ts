import { docTypeLabel, formatDisplayDate, settlementMethodLabel, toStoredDate } from './format';

describe('docTypeLabel', () => {
  it('title-cases document types', () => {
    expect(docTypeLabel('invoice')).toBe('Invoice');
    expect(docTypeLabel('estimate')).toBe('Estimate');
  });
});

describe('settlementMethodLabel', () => {
  it('maps stored methods to display names', () => {
    expect(settlementMethodLabel('bank_transfer')).toBe('Bank Transfer');
    expect(settlementMethodLabel('cash')).toBe('Cash');
    expect(settlementMethodLabel('check')).toBe('Check');
    expect(settlementMethodLabel('other')).toBe('Other');
  });
});

describe('formatDisplayDate', () => {
  it('formats plain stored dates without shifting the day', () => {
    expect(formatDisplayDate('2026-09-01')).toBe('Sep 1, 2026');
    expect(formatDisplayDate('2026-01-31')).toBe('Jan 31, 2026');
  });
});

describe('toStoredDate', () => {
  it('keeps the local calendar day, even late in the evening', () => {
    expect(toStoredDate(new Date(2026, 8, 1, 0, 0))).toBe('2026-09-01');
    expect(toStoredDate(new Date(2026, 8, 1, 23, 59))).toBe('2026-09-01');
  });

  it('round-trips with formatDisplayDate', () => {
    expect(formatDisplayDate(toStoredDate(new Date(2026, 11, 31)))).toBe('Dec 31, 2026');
  });
});
