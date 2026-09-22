import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type { LineItemComputedFields } from '../../lib/documentCalculations';
import type { LineItem, LineItemEditable } from '../../types/models';

export async function listLineItems(documentId: string): Promise<LineItem[]> {
  const { data, error } = await supabase
    .from('line_items')
    .select('*')
    .eq('document_id', documentId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Replaces all line items for a document. Not run inside a database transaction alongside the
 * caller's document-total update (Supabase/PostgREST has no client-side transaction API) — the
 * delete and the inserts are sequential requests. Acceptable for this app's single-device,
 * sequential-edit usage; a Postgres RPC would be needed to make this fully atomic. */
export async function replaceLineItems(
  documentId: string,
  lines: (LineItemEditable & LineItemComputedFields)[]
): Promise<void> {
  const ownerId = requireOwnerId();
  const { error: deleteError } = await supabase.from('line_items').delete().eq('document_id', documentId);
  if (deleteError) throw deleteError;
  if (lines.length === 0) return;

  const now = nowIso();
  const rows = lines.map((line, index) => ({
    id: line.id ?? newId(),
    owner_id: ownerId,
    document_id: documentId,
    catalog_item_id: line.catalogItemId,
    position: index,
    description: line.description,
    quantity: line.quantity,
    unit_label: line.unitLabel,
    unit_price_minor: line.unitPriceMinor,
    discount_type: line.discountType,
    discount_value: line.discountValue,
    is_taxable: line.isTaxable ? 1 : 0,
    tax_bracket_id: line.taxBracketId,
    tax_bracket_name_snapshot: line.taxBracketNameSnapshot,
    tax_rate_bp: line.taxRateBp,
    line_subtotal_minor: line.lineSubtotalMinor,
    line_discount_minor: line.lineDiscountMinor,
    line_tax_minor: line.lineTaxMinor,
    line_total_minor: line.lineTotalMinor,
    created_at: now,
    updated_at: now,
  }));
  const { error: insertError } = await supabase.from('line_items').insert(rows);
  if (insertError) throw insertError;
}
