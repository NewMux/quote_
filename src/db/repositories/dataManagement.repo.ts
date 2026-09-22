import { db } from '../client';
import { newId, nowIso } from '../../lib/id';

/** Wipes every user-entered record and resets business_profile to its fresh-install defaults
 * (it's a singleton row, CHECK (id = 1), so it's reset rather than deleted). Re-seeds the
 * default "No Tax" bracket the same way 001_init.ts does on a brand new install, so the app
 * ends up in exactly the same state as after a fresh install. */
export async function wipeAllData(): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM activity_logs');
    await db.runAsync('DELETE FROM settlements');
    await db.runAsync('DELETE FROM signatures');
    await db.runAsync('DELETE FROM line_items');
    await db.runAsync('DELETE FROM documents');
    await db.runAsync('DELETE FROM clients');
    await db.runAsync('DELETE FROM item_catalog');
    await db.runAsync('DELETE FROM tax_brackets');
    await db.runAsync('DELETE FROM doc_counters');

    const now = nowIso();
    await db.runAsync(
      `UPDATE business_profile SET
         business_name = '', logo_uri = NULL, accent_color = '#2563EB',
         email = NULL, phone = NULL, address = NULL, tax_registration_number = NULL,
         payment_instructions = NULL, footer_terms = NULL, default_currency_code = 'USD',
         default_payment_terms_days = 14, estimate_prefix = 'EST-', invoice_prefix = 'INV-',
         number_padding = 3, reset_numbering_yearly = 0, updated_at = ?
       WHERE id = 1`,
      [now]
    );
    await db.runAsync(
      `INSERT INTO tax_brackets (id, name, rate_bp, is_default, created_at, updated_at)
       VALUES (?, 'No Tax', 0, 1, ?, ?)`,
      [newId(), now, now]
    );
  });
}
