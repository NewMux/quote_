import type { SQLiteBindValue } from 'expo-sqlite';
import { db } from '../client';
import { nowIso } from '../../lib/id';
import type { BusinessProfile } from '../../types/models';

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const row = await db.getFirstAsync<BusinessProfile>(
    'SELECT * FROM business_profile WHERE id = 1'
  );
  if (!row) {
    throw new Error('Business profile row missing — migration did not seed it.');
  }
  return row;
}

export async function updateBusinessProfile(
  patch: Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const keys = Object.keys(patch);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (patch as Record<string, SQLiteBindValue>)[k]);
  await db.runAsync(
    `UPDATE business_profile SET ${setClause}, updated_at = ? WHERE id = 1`,
    [...values, nowIso()]
  );
}
