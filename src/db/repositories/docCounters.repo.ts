import { db } from '../client';
import { formatDocNumber } from '../../lib/docNumber';
import type { BusinessProfile, DocType } from '../../types/models';

/** Must be called from within db.withTransactionAsync(...) alongside the document insert, so the
 * reservation and the row creation commit or roll back together. Reserves and returns the next
 * formatted document number. */
export async function reserveNextDocNumber(
  docType: DocType,
  profile: BusinessProfile
): Promise<string> {
  const yearBucket = profile.reset_numbering_yearly ? new Date().getFullYear() : 0;
  const prefix = docType === 'estimate' ? profile.estimate_prefix : profile.invoice_prefix;

  const existing = await db.getFirstAsync<{ next_number: number }>(
    'SELECT next_number FROM doc_counters WHERE doc_type = ? AND year_bucket = ?',
    [docType, yearBucket]
  );

  const nextNumber = existing?.next_number ?? 1;

  if (existing) {
    await db.runAsync(
      'UPDATE doc_counters SET next_number = next_number + 1 WHERE doc_type = ? AND year_bucket = ?',
      [docType, yearBucket]
    );
  } else {
    await db.runAsync(
      'INSERT INTO doc_counters (doc_type, year_bucket, next_number) VALUES (?, ?, 2)',
      [docType, yearBucket]
    );
  }

  return formatDocNumber(prefix, nextNumber, profile.number_padding, yearBucket);
}
