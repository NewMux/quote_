import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type { TaxBracket } from '../../types/models';

function sortByName(brackets: TaxBracket[]): TaxBracket[] {
  return [...brackets].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function listTaxBrackets(includeArchived = false): Promise<TaxBracket[]> {
  const ownerId = requireOwnerId();
  let query = supabase.from('tax_brackets').select('*').eq('owner_id', ownerId);
  if (!includeArchived) query = query.eq('is_archived', 0);
  const { data, error } = await query;
  if (error) throw error;
  return sortByName(data ?? []);
}

export async function getTaxBracket(id: string): Promise<TaxBracket | null> {
  const { data, error } = await supabase.from('tax_brackets').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDefaultTaxBracket(): Promise<TaxBracket | null> {
  const ownerId = requireOwnerId();
  const { data, error } = await supabase
    .from('tax_brackets')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_default', 1)
    .eq('is_archived', 0)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface TaxBracketInput {
  name: string;
  rate_bp: number;
}

export async function createTaxBracket(input: TaxBracketInput): Promise<TaxBracket> {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const { data, error } = await supabase
    .from('tax_brackets')
    .insert({ id: newId(), owner_id: ownerId, name: input.name, rate_bp: input.rate_bp, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaxBracket(id: string, input: TaxBracketInput): Promise<void> {
  const { error } = await supabase
    .from('tax_brackets')
    .update({ name: input.name, rate_bp: input.rate_bp, updated_at: nowIso() })
    .eq('id', id);
  if (error) throw error;
}

export async function setDefaultTaxBracket(id: string): Promise<void> {
  const ownerId = requireOwnerId();
  const { error: clearError } = await supabase.from('tax_brackets').update({ is_default: 0 }).eq('owner_id', ownerId);
  if (clearError) throw clearError;
  const { error } = await supabase.from('tax_brackets').update({ is_default: 1, updated_at: nowIso() }).eq('id', id);
  if (error) throw error;
}

export async function setTaxBracketArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('tax_brackets')
    .update({ is_archived: archived ? 1 : 0, updated_at: nowIso() })
    .eq('id', id);
  if (error) throw error;
}
