import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { ItemCatalogEntry } from '../../types/models';

export async function listItems(includeArchived = false): Promise<ItemCatalogEntry[]> {
  if (includeArchived) {
    return db.getAllAsync<ItemCatalogEntry>('SELECT * FROM item_catalog ORDER BY name COLLATE NOCASE');
  }
  return db.getAllAsync<ItemCatalogEntry>(
    'SELECT * FROM item_catalog WHERE is_archived = 0 ORDER BY name COLLATE NOCASE'
  );
}

export async function searchItems(query: string): Promise<ItemCatalogEntry[]> {
  return db.getAllAsync<ItemCatalogEntry>(
    `SELECT * FROM item_catalog WHERE is_archived = 0 AND name LIKE ? COLLATE NOCASE
     ORDER BY name COLLATE NOCASE LIMIT 50`,
    [`%${query}%`]
  );
}

export async function getItem(id: string): Promise<ItemCatalogEntry | null> {
  return db.getFirstAsync<ItemCatalogEntry>('SELECT * FROM item_catalog WHERE id = ?', [id]);
}

export interface ItemInput {
  name: string;
  description?: string | null;
  default_unit_price_minor: number;
  unit_label: string;
  is_taxable: boolean;
  default_tax_bracket_id?: string | null;
}

export async function createItem(input: ItemInput): Promise<ItemCatalogEntry> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO item_catalog
      (id, name, description, default_unit_price_minor, unit_label, is_taxable, default_tax_bracket_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.description ?? null,
      input.default_unit_price_minor,
      input.unit_label,
      input.is_taxable ? 1 : 0,
      input.default_tax_bracket_id ?? null,
      now,
      now,
    ]
  );
  const created = await getItem(id);
  if (!created) throw new Error('Failed to create item');
  return created;
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
  await db.runAsync(
    `UPDATE item_catalog SET name = ?, description = ?, default_unit_price_minor = ?, unit_label = ?,
       is_taxable = ?, default_tax_bracket_id = ?, updated_at = ? WHERE id = ?`,
    [
      input.name,
      input.description ?? null,
      input.default_unit_price_minor,
      input.unit_label,
      input.is_taxable ? 1 : 0,
      input.default_tax_bracket_id ?? null,
      nowIso(),
      id,
    ]
  );
}

export async function setItemArchived(id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE item_catalog SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    nowIso(),
    id,
  ]);
}
