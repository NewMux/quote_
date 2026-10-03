import { annualSavingsPercent, hasProEntitlement, introOfferLabel } from './subscription';

describe('hasProEntitlement', () => {
  it('is true only when the pro entitlement is active', () => {
    expect(hasProEntitlement({ entitlements: { active: { pro: {} } } })).toBe(true);
    expect(hasProEntitlement({ entitlements: { active: {} } })).toBe(false);
    expect(hasProEntitlement({ entitlements: { active: { other: {} } } })).toBe(false);
  });

  it('is false when there is no customer info yet', () => {
    expect(hasProEntitlement(null)).toBe(false);
    expect(hasProEntitlement(undefined)).toBe(false);
  });
});

describe('annualSavingsPercent', () => {
  it('computes the saving against twelve monthly payments', () => {
    expect(annualSavingsPercent(9.99, 79.99)).toBe(33);
    expect(annualSavingsPercent(10, 60)).toBe(50);
  });

  it('returns null when the annual plan is not cheaper', () => {
    expect(annualSavingsPercent(10, 120)).toBeNull();
    expect(annualSavingsPercent(10, 130)).toBeNull();
  });

  it('returns null for missing or invalid prices', () => {
    expect(annualSavingsPercent(0, 50)).toBeNull();
    expect(annualSavingsPercent(10, 0)).toBeNull();
  });

  it('returns null rather than a 0% badge for a negligible saving', () => {
    expect(annualSavingsPercent(10, 119.5)).toBeNull();
  });
});

describe('introOfferLabel', () => {
  it('describes a paid introductory offer', () => {
    expect(introOfferLabel({ price: 0.99, priceString: '$0.99', periodUnit: 'MONTH', periodNumberOfUnits: 1 })).toBe(
      '$0.99 for 1 month'
    );
    expect(introOfferLabel({ price: 0.99, priceString: '$0.99', periodUnit: 'DAY', periodNumberOfUnits: 7 })).toBe(
      '$0.99 for 1 week'
    );
    expect(introOfferLabel({ price: 0.99, priceString: '$0.99', periodUnit: 'MONTH', periodNumberOfUnits: 2 })).toBe(
      '$0.99 for 2 months'
    );
  });

  it('ignores free trials and missing offers', () => {
    expect(introOfferLabel({ price: 0, priceString: '$0.00', periodUnit: 'DAY', periodNumberOfUnits: 7 })).toBeNull();
    expect(introOfferLabel(null)).toBeNull();
  });

  it('ignores unknown units', () => {
    expect(introOfferLabel({ price: 0.99, priceString: '$0.99', periodUnit: 'UNKNOWN', periodNumberOfUnits: 3 })).toBeNull();
  });
});
