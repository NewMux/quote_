import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { ActivityEventType, ActivityLogEntry } from '../../types/models';

export async function logActivity(
  documentId: string,
  eventType: ActivityEventType,
  eventDetail?: string | null
): Promise<void> {
  await db.runAsync(
    'INSERT INTO activity_logs (id, document_id, event_type, event_detail, created_at) VALUES (?, ?, ?, ?, ?)',
    [newId(), documentId, eventType, eventDetail ?? null, nowIso()]
  );
}

export async function listActivity(documentId: string): Promise<ActivityLogEntry[]> {
  return db.getAllAsync<ActivityLogEntry>(
    'SELECT * FROM activity_logs WHERE document_id = ? ORDER BY created_at DESC',
    [documentId]
  );
}
