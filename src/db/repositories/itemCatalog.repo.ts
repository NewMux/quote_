import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type { ItemCatalogEntry } from '../../types/models';

function sortByName(items: ItemCatalogEntry[]): ItemCatalogEntry[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function listItems(includeArchived = false): Promise<ItemCatalogEntry[]> {
  const ownerId = requireOwnerId();
  let query = supabase.from('item_catalog').select('*').eq('owner_id', ownerId);
  if (!includeArchived) query = query.eq('is_archived', 0);
  const { data, error } = await query;
  if (error) throw error;
  return sortByName(data ?? []);
}

export async function searchItems(query: string): Promise<ItemCatalogEntry[]> {
  const ownerId = requireOwnerId();
  const { data, error } = await supabase
    .from('item_catalog')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_archived', 0)
    .ilike('name', `%${query}%`)
    .limit(50);
  if (error) throw error;
  return sortByName(data ?? []);
}

export async function getItem(id: string): Promise<ItemCatalogEntry | null> {
  const { data, error } = await supabase.from('item_catalog').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
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
  const ownerId = requireOwnerId();
  const now = nowIso();
  const { data, error } = await supabase
    .from('item_catalog')
    .insert({
      id: newId(),
      owner_id: ownerId,
      name: input.name,
      description: input.description ?? null,
      default_unit_price_minor: input.default_unit_price_minor,
      unit_label: input.unit_label,
      is_taxable: input.is_taxable ? 1 : 0,
      default_tax_bracket_id: input.default_tax_bracket_id ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
  const { error } = await supabase
    .from('item_catalog')
    .update({
      name: input.name,
      description: input.description ?? null,
      default_unit_price_minor: input.default_unit_price_minor,
      unit_label: input.unit_label,
      is_taxable: input.is_taxable ? 1 : 0,
      default_tax_bracket_id: input.default_tax_bracket_id ?? null,
      updated_at: nowIso(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function setItemArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('item_catalog')
    .update({ is_archived: archived ? 1 : 0, updated_at: nowIso() })
    .eq('id', id);
  if (error) throw error;
}
