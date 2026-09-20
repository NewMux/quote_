import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { Client } from '../../types/models';

export async function listClients(includeArchived = false): Promise<Client[]> {
  if (includeArchived) {
    return db.getAllAsync<Client>('SELECT * FROM clients ORDER BY display_name COLLATE NOCASE');
  }
  return db.getAllAsync<Client>(
    'SELECT * FROM clients WHERE is_archived = 0 ORDER BY display_name COLLATE NOCASE'
  );
}

export async function searchClients(query: string): Promise<Client[]> {
  return db.getAllAsync<Client>(
    `SELECT * FROM clients WHERE is_archived = 0 AND display_name LIKE ? COLLATE NOCASE
     ORDER BY display_name COLLATE NOCASE LIMIT 50`,
    [`%${query}%`]
  );
}

export async function getClient(id: string): Promise<Client | null> {
  return db.getFirstAsync<Client>('SELECT * FROM clients WHERE id = ?', [id]);
}

export interface ClientInput {
  display_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_registration_number?: string | null;
  notes?: string | null;
  photo_uri?: string | null;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO clients
      (id, display_name, contact_name, email, phone, address, tax_registration_number, notes, photo_uri, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.display_name,
      input.contact_name ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.tax_registration_number ?? null,
      input.notes ?? null,
      input.photo_uri ?? null,
      now,
      now,
    ]
  );
  const created = await getClient(id);
  if (!created) throw new Error('Failed to create client');
  return created;
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  await db.runAsync(
    `UPDATE clients SET display_name = ?, contact_name = ?, email = ?, phone = ?, address = ?,
       tax_registration_number = ?, notes = ?, photo_uri = ?, updated_at = ? WHERE id = ?`,
    [
      input.display_name,
      input.contact_name ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.tax_registration_number ?? null,
      input.notes ?? null,
      input.photo_uri ?? null,
      nowIso(),
      id,
    ]
  );
}

export async function setClientArchived(id: string, archived: boolean): Promise<void> {
  await db.runAsync('UPDATE clients SET is_archived = ?, updated_at = ? WHERE id = ?', [
    archived ? 1 : 0,
    nowIso(),
    id,
  ]);
}
