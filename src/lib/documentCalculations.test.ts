import { computeDocumentTotals, computeLineItem, getTaxLabel, type LineItemDraft } from './documentCalculations';

function line(overrides: Partial<LineItemDraft> = {}): LineItemDraft {
  return {
    id: 'l1',
    description: 'Item',
    quantity: 1,
    unitPriceMinor: 1000,
    discountType: null,
    discountValue: null,
    isTaxable: false,
    taxRateBp: 0,
    ...overrides,
  };
}

describe('computeLineItem', () => {
  it('computes a plain line with no discount or tax', () => {
    const result = computeLineItem(line({ quantity: 2, unitPriceMinor: 500 }));
    expect(result.lineSubtotalMinor).toBe(1000);
    expect(result.lineDiscountMinor).toBe(0);
    expect(result.lineTaxMinor).toBe(0);
    expect(result.lineTotalMinor).toBe(1000);
  });

  it('applies a line-level percent discount before tax', () => {
    const result = computeLineItem(
      line({ quantity: 1, unitPriceMinor: 10000, discountType: 'percent', discountValue: 1000 })
    );
    expect(result.lineSubtotalMinor).toBe(10000);
    expect(result.lineDiscountMinor).toBe(1000); // 10% of 10000
    expect(result.lineTotalMinor).toBe(9000);
  });

  it('taxes the post-discount amount, not the raw subtotal', () => {
    const result = computeLineItem(
      line({
        quantity: 1,
        unitPriceMinor: 10000,
        discountType: 'fixed',
        discountValue: 2000,
        isTaxable: true,
        taxRateBp: 1000, // 10%
      })
    );
    expect(result.lineSubtotalMinor).toBe(10000);
    expect(result.lineDiscountMinor).toBe(2000);
    expect(result.lineTaxMinor).toBe(800); // 10% of (10000 - 2000)
    expect(result.lineTotalMinor).toBe(8800);
  });

  it('charges no tax when isTaxable is false, regardless of taxRateBp', () => {
    const result = computeLineItem(line({ unitPriceMinor: 10000, isTaxable: false, taxRateBp: 2000 }));
    expect(result.lineTaxMinor).toBe(0);
  });

  it('rounds a fractional quantity x price subtotal', () => {
    const result = computeLineItem(line({ quantity: 1.5, unitPriceMinor: 333 }));
    expect(result.lineSubtotalMinor).toBe(500); // 499.5 -> 500
  });

  it('passes through extra fields on the line untouched (generic caller data)', () => {
    const result = computeLineItem({ ...line(), catalogItemId: 'item-42' } as LineItemDraft & {
      catalogItemId: string;
    });
    expect(result.catalogItemId).toBe('item-42');
  });
});

describe('computeDocumentTotals', () => {
  it('sums multiple lines with no discounts or tax', () => {
    const totals = computeDocumentTotals(
      [line({ id: 'a', unitPriceMinor: 1000 }), line({ id: 'b', unitPriceMinor: 2000 })],
      null,
      null
    );
    expect(totals.subtotalMinor).toBe(3000);
    expect(totals.discountAmountMinor).toBe(0);
    expect(totals.taxTotalMinor).toBe(0);
    expect(totals.totalMinor).toBe(3000);
    expect(totals.lines).toHaveLength(2);
  });

  it('applies a document-level discount on top of the post-line-discount subtotal', () => {
    const totals = computeDocumentTotals(
      [line({ id: 'a', unitPriceMinor: 10000, discountType: 'fixed', discountValue: 1000 })],
      'percent',
      1000 // 10% document discount
    );
    // line subtotal 10000, line discount 1000 -> base for doc discount = 9000
    // doc discount = 10% of 9000 = 900
    expect(totals.discountAmountMinor).toBe(1900); // 1000 line + 900 document
    expect(totals.totalMinor).toBe(8100);
  });

  it('sums tax across lines with different tax rates', () => {
    const totals = computeDocumentTotals(
      [
        line({ id: 'a', unitPriceMinor: 10000, isTaxable: true, taxRateBp: 1000 }), // 1000 tax
        line({ id: 'b', unitPriceMinor: 5000, isTaxable: true, taxRateBp: 2000 }), // 1000 tax
        line({ id: 'c', unitPriceMinor: 3000, isTaxable: false, taxRateBp: 9999 }), // 0 tax
      ],
      null,
      null
    );
    expect(totals.taxTotalMinor).toBe(2000);
    expect(totals.totalMinor).toBe(18000 + 2000);
  });

  it('returns all zeros for an empty document', () => {
    const totals = computeDocumentTotals([], null, null);
    expect(totals.subtotalMinor).toBe(0);
    expect(totals.totalMinor).toBe(0);
    expect(totals.lines).toEqual([]);
  });
});

describe('getTaxLabel', () => {
  it('returns the real tax bracket name when every taxed line agrees', () => {
    expect(
      getTaxLabel([
        { isTaxable: true, taxName: 'VAT' },
        { isTaxable: true, taxName: 'VAT' },
      ])
    ).toBe('VAT');
  });

  it('falls back to the generic label when taxed lines disagree on the name', () => {
    expect(
      getTaxLabel([
        { isTaxable: true, taxName: 'VAT' },
        { isTaxable: true, taxName: 'Sales Tax' },
      ])
    ).toBe('Tax');
  });

  it('falls back to the generic label when no line is taxed', () => {
    expect(getTaxLabel([{ isTaxable: false, taxName: null }])).toBe('Tax');
  });

  it('ignores the tax name on non-taxable lines when determining agreement', () => {
    expect(
      getTaxLabel([
        { isTaxable: true, taxName: 'VAT' },
        { isTaxable: false, taxName: 'Some Other Name' },
      ])
    ).toBe('VAT');
  });
});
