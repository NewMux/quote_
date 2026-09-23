import { annualSavingsPercent, hasProEntitlement, trialLabel } from './subscription';

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

describe('trialLabel', () => {
  it('describes a free introductory offer', () => {
    expect(trialLabel({ price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7 })).toBe('7-day free trial');
    expect(trialLabel({ price: 0, periodUnit: 'MONTH', periodNumberOfUnits: 1 })).toBe('1-month free trial');
  });

  it('ignores paid discounts and missing offers', () => {
    expect(trialLabel({ price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 })).toBeNull();
    expect(trialLabel(null)).toBeNull();
  });

  it('ignores unknown units', () => {
    expect(trialLabel({ price: 0, periodUnit: 'UNKNOWN', periodNumberOfUnits: 3 })).toBeNull();
  });
});
