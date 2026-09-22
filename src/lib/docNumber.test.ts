import { formatDocNumber } from './docNumber';

describe('formatDocNumber', () => {
  it('pads the sequence to the configured width', () => {
    expect(formatDocNumber('INV-', 3, 3, 0)).toBe('INV-003');
  });

  it('does not truncate a sequence wider than the padding', () => {
    expect(formatDocNumber('INV-', 12345, 3, 0)).toBe('INV-12345');
  });

  it('inserts the year bucket between the prefix and the sequence when set', () => {
    expect(formatDocNumber('INV-', 7, 3, 2026)).toBe('INV-2026-007');
  });

  it('omits the year bucket entirely when it is 0 (yearly reset disabled)', () => {
    expect(formatDocNumber('EST-', 1, 3, 0)).toBe('EST-001');
  });

  it('works with an empty prefix', () => {
    expect(formatDocNumber('', 1, 3, 0)).toBe('001');
  });

  it('works with 0 padding (no leading zeros)', () => {
    expect(formatDocNumber('INV-', 7, 0, 0)).toBe('INV-7');
  });
});
