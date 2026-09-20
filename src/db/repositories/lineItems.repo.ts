import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { LineItemComputedFields } from '../../lib/documentCalculations';
import type { LineItem, LineItemEditable } from '../../types/models';

export async function listLineItems(documentId: string): Promise<LineItem[]> {
  return db.getAllAsync<LineItem>(
    'SELECT * FROM line_items WHERE document_id = ? ORDER BY position ASC',
    [documentId]
  );
}

/** Replaces all line items for a document. Must be called inside db.withTransactionAsync alongside the document total update. */
export async function replaceLineItems(
  documentId: string,
  lines: Array<LineItemEditable & LineItemComputedFields>
): Promise<void> {
  await db.runAsync('DELETE FROM line_items WHERE document_id = ?', [documentId]);
  const now = nowIso();
  for (const [index, line] of lines.entries()) {
    await db.runAsync(
      `INSERT INTO line_items (
        id, document_id, catalog_item_id, position, description, quantity, unit_label,
        unit_price_minor, discount_type, discount_value, is_taxable, tax_bracket_id,
        tax_bracket_name_snapshot, tax_rate_bp, line_subtotal_minor, line_discount_minor,
        line_tax_minor, line_total_minor, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        line.id ?? newId(),
        documentId,
        line.catalogItemId,
        index,
        line.description,
        line.quantity,
        line.unitLabel,
        line.unitPriceMinor,
        line.discountType,
        line.discountValue,
        line.isTaxable ? 1 : 0,
        line.taxBracketId,
        line.taxBracketNameSnapshot,
        line.taxRateBp,
        line.lineSubtotalMinor,
        line.lineDiscountMinor,
        line.lineTaxMinor,
        line.lineTotalMinor,
        now,
        now,
      ]
    );
  }
}
