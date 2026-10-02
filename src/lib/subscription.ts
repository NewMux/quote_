/** Pure subscription helpers — no RevenueCat import, so they stay unit-testable and the paywall's
 * wording/maths can be verified without a native build. */

/** The one RevenueCat entitlement that unlocks the whole app. Must match the identifier created in
 * the RevenueCat dashboard. */
export const ENTITLEMENT_ID = 'pro';

/** Apple's standard Terms of Use (EULA), which apps without a custom EULA link to from the
 * paywall per App Store guideline 3.1.2. */
export const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/** Where a person manages or cancels an App Store subscription. */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

interface CustomerInfoLike {
  entitlements: { active: Record<string, unknown> };
}

export function hasProEntitlement(info: CustomerInfoLike | null | undefined): boolean {
  return Boolean(info?.entitlements.active[ENTITLEMENT_ID]);
}

/** Whole-number percentage saved by paying yearly instead of 12 monthly payments, or null when the
 * annual plan isn't actually cheaper (so the paywall never shows a "Save 0%" or negative badge). */
export function annualSavingsPercent(monthlyPrice: number, annualPrice: number): number | null {
  if (monthlyPrice <= 0 || annualPrice <= 0) return null;
  const yearlyAtMonthlyRate = monthlyPrice * 12;
  if (annualPrice >= yearlyAtMonthlyRate) return null;
  const percent = Math.floor(((yearlyAtMonthlyRate - annualPrice) / yearlyAtMonthlyRate) * 100);
  return percent > 0 ? percent : null;
}

interface IntroPriceLike {
  price: number;
  priceString: string;
  periodUnit: string;
  periodNumberOfUnits: number;
}

const UNIT_WORDS: Record<string, string> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };

/** "$2.99 for 1 week" for a paid introductory offer; null when there's no intro offer or it's a
 * free trial (the app doesn't offer free trials). Whole weeks given in days are shown as weeks. */
export function introOfferLabel(intro: IntroPriceLike | null | undefined): string | null {
  if (!intro || intro.price <= 0) return null;
  let unit = UNIT_WORDS[intro.periodUnit.toUpperCase()];
  let count = intro.periodNumberOfUnits;
  if (!unit || count <= 0) return null;
  if (unit === 'day' && count % 7 === 0) {
    unit = 'week';
    count /= 7;
  }
  return `${intro.priceString} for ${count} ${unit}${count === 1 ? '' : 's'}`;
}
