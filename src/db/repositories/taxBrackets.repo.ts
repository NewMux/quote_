import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { TaxBracket } from '../../types/models';

export async function listTaxBrackets(includeArchived = false): Promise<TaxBracket[]> {
  if (includeArchived) {
    return db.getAllAsync<TaxBracket>('SELECT * FROM tax_brackets ORDER BY name COLLATE NOCASE');
  }
  return db.getAllAsync<TaxBracket>(
    'SELECT * FROM tax_brackets WHERE is_archived = 0 ORDER BY name COLLATE NOCASE'
  );
}

export async function getTaxBracket(id: string): Promise<TaxBracket | null> {
  return db.getFirstAsync<TaxBracket>('SELECT * FROM tax_brackets WHERE id = ?', [id]);
}

export async function getDefaultTaxBracket(): Promise<TaxBracket | null> {
  return db.getFirstAsync<TaxBracket>(
    'SELECT * FROM tax_brackets WHERE is_default = 1 AND is_archived = 0'
  );
}

export interface TaxBracketInput {
  name: string;
  rate_bp: number;
}

export async function createTaxBracket(input: TaxBracketInput): Promise<TaxBracket> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    'INSERT INTO tax_brackets (id, name, rate_bp, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.name, input.rate_bp, now, now]
  );
  const created = await getTaxBracket(id);
  if (!created) throw new Error('Failed to create tax bracket');
  return created;
}

export async function updateTaxBracket(id: string, input: TaxBracketInput): Promise<void> {
  await db.runAsync('UPDATE tax_brackets SET name = ?, rate_bp = ?, updated_at = ? WHERE id = ?', [
    input.name,
    input.rate_bp,
    nowIso(),
    id,
  ]);
}

export async function setDefaultTaxBracket(id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE tax_brackets SET is_default = 0');
    await db.runAsync('UPDATE tax_brackets SET is_default = 1, updated_at = ? WHERE id = ?', [
      nowIso(),
      id,
    ]);
  });
}

export async function setTaxBracketArchived(id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE tax_brackets SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    nowIso(),
    id,
  ]);
}
