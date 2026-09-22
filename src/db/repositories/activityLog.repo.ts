import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type { ActivityEventType, ActivityLogEntry } from '../../types/models';

export async function logActivity(
  documentId: string,
  eventType: ActivityEventType,
  eventDetail?: string | null
): Promise<void> {
  const ownerId = requireOwnerId();
  const { error } = await supabase.from('activity_logs').insert({
    id: newId(),
    owner_id: ownerId,
    document_id: documentId,
    event_type: eventType,
    event_detail: eventDetail ?? null,
    created_at: nowIso(),
  });
  if (error) throw error;
}

export async function listActivity(documentId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
