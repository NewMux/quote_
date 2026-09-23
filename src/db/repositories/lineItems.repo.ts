import { supabase } from '../../lib/supabase';
import type { LineItem } from '../../types/models';

export async function listLineItems(documentId: string): Promise<LineItem[]> {
  const { data, error } = await supabase
    .from('line_items')
    .select('*')
    .eq('document_id', documentId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
