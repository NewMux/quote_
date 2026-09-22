import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { deleteFileIfExists } from '../../lib/fileStorage';
import { requireOwnerId } from '../ownerId';
import type { Client } from '../../types/models';

export interface ClientListOptions {
  search?: string;
  sortBy?: 'name' | 'recent';
  hasBalanceOnly?: boolean;
}

function sortClients(clients: Client[], sortBy: ClientListOptions['sortBy']): Client[] {
  const sorted = [...clients];
  if (sortBy === 'recent') {
    sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else {
    // PostgREST can't order by a case-insensitive expression, so this mirrors the old
    // SQLite `COLLATE NOCASE` ordering client-side instead.
    sorted.sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }));
  }
  return sorted;
}

export async function listClients(options: ClientListOptions = {}): Promise<Client[]> {
  const ownerId = requireOwnerId();
  let query = supabase.from('clients').select('*').eq('owner_id', ownerId).eq('is_archived', 0);

  if (options.search) {
    query = query.ilike('display_name', `%${options.search}%`).limit(50);
  }

  if (options.hasBalanceOnly) {
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('client_id, total_minor, amount_paid_minor')
      .eq('owner_id', ownerId)
      .not('client_id', 'is', null)
      .not('status', 'in', '("draft","void")');
    if (docsError) throw docsError;

    const balanceByClient = new Map<string, number>();
    for (const d of docs ?? []) {
      if (!d.client_id) continue;
      balanceByClient.set(d.client_id, (balanceByClient.get(d.client_id) ?? 0) + (d.total_minor - d.amount_paid_minor));
    }
    const idsWithBalance = [...balanceByClient.entries()].filter(([, balance]) => balance > 0).map(([id]) => id);
    if (idsWithBalance.length === 0) return [];
    query = query.in('id', idsWithBalance);
  }

  const { data, error } = await query;
  if (error) throw error;
  return sortClients(data ?? [], options.sortBy);
}

export async function searchClients(query: string): Promise<Client[]> {
  const ownerId = requireOwnerId();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_archived', 0)
    .ilike('display_name', `%${query}%`)
    .limit(50);
  if (error) throw error;
  return sortClients(data ?? [], 'name');
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
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
  const ownerId = requireOwnerId();
  const now = nowIso();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      id: newId(),
      owner_id: ownerId,
      display_name: input.display_name,
      contact_name: input.contact_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      tax_registration_number: input.tax_registration_number ?? null,
      notes: input.notes ?? null,
      photo_uri: input.photo_uri ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({
      display_name: input.display_name,
      contact_name: input.contact_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      tax_registration_number: input.tax_registration_number ?? null,
      notes: input.notes ?? null,
      photo_uri: input.photo_uri ?? null,
      updated_at: nowIso(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setClientArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ is_archived: archived ? 1 : 0, updated_at: nowIso() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { data: client } = await supabase.from('clients').select('photo_uri').eq('id', id).maybeSingle();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
  await deleteFileIfExists(client?.photo_uri ?? null);
}
