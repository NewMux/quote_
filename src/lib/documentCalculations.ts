import { applyDiscount, applyTaxBp } from './money';
import type { DiscountType } from '../types/models';

export interface LineItemDraft {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  isTaxable: boolean;
  taxRateBp: number;
}

export interface LineItemComputedFields {
  lineSubtotalMinor: number;
  lineDiscountMinor: number;
  lineTaxMinor: number;
  lineTotalMinor: number;
}

export type LineItemComputed = LineItemDraft & LineItemComputedFields;

export interface DocumentTotals<T extends LineItemDraft = LineItemDraft> {
  subtotalMinor: number;
  discountAmountMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
  lines: (T & LineItemComputedFields)[];
}

/** Generic so callers can pass richer line objects (e.g. with persistence-only fields like
 * catalogItemId) and get them back untouched alongside the computed totals fields. */
export function computeLineItem<T extends LineItemDraft>(line: T): T & LineItemComputedFields {
  const rawSubtotal = Math.round(line.quantity * line.unitPriceMinor);
  const lineDiscountMinor = applyDiscount(rawSubtotal, line.discountType, line.discountValue);
  const taxableBase = rawSubtotal - lineDiscountMinor;
  const lineTaxMinor = line.isTaxable ? applyTaxBp(taxableBase, line.taxRateBp) : 0;
  const lineTotalMinor = taxableBase + lineTaxMinor;
  return {
    ...line,
    lineSubtotalMinor: rawSubtotal,
    lineDiscountMinor,
    lineTaxMinor,
    lineTotalMinor,
  };
}

export function computeDocumentTotals<T extends LineItemDraft>(
  lines: T[],
  documentDiscountType: DiscountType | null,
  documentDiscountValue: number | null
): DocumentTotals<T> {
  const computedLines = lines.map(computeLineItem);
  const subtotalMinor = computedLines.reduce((sum, l) => sum + l.lineSubtotalMinor, 0);
  const lineLevelDiscount = computedLines.reduce((sum, l) => sum + l.lineDiscountMinor, 0);
  const documentDiscountMinor = applyDiscount(
    subtotalMinor - lineLevelDiscount,
    documentDiscountType,
    documentDiscountValue
  );
  const taxTotalMinor = computedLines.reduce((sum, l) => sum + l.lineTaxMinor, 0);
  const discountAmountMinor = lineLevelDiscount + documentDiscountMinor;
  const totalMinor = subtotalMinor - discountAmountMinor + taxTotalMinor;

  return {
    subtotalMinor,
    discountAmountMinor,
    taxTotalMinor,
    totalMinor,
    lines: computedLines,
  };
}

/** Shows the actual tax bracket name (e.g. "VAT") when every taxed line agrees on one;
 * falls back to the generic label when lines mix different tax names or none are taxed. */
export function getTaxLabel(items: { isTaxable: boolean; taxName: string | null }[]): string {
  const names = new Set(
    items.filter((i) => i.isTaxable && i.taxName).map((i) => i.taxName as string)
  );
  return names.size === 1 ? [...names][0] : 'Tax';
}
