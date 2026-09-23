import { supabase } from '../../lib/supabase';
import { nowIso } from '../../lib/id';
import { requireOwnerId } from '../ownerId';
import type {
  RecurrenceFrequency,
  RecurringSchedule,
  RecurringScheduleListItem,
} from '../../types/models';

export async function getScheduleForDocument(documentId: string): Promise<RecurringSchedule | null> {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*')
    .eq('template_document_id', documentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listSchedules(): Promise<RecurringScheduleListItem[]> {
  const ownerId = requireOwnerId();
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*, documents(doc_number, client_name_snapshot, clients(display_name))')
    .eq('owner_id', ownerId)
    .order('next_run_date', { ascending: true });
  if (error) throw error;

  type Embedded = {
    doc_number: string;
    client_name_snapshot: string | null;
    clients: { display_name: string } | { display_name: string }[] | null;
  };
  type Row = RecurringSchedule & { documents: Embedded | Embedded[] | null };

  return ((data ?? []) as Row[]).map(({ documents, ...schedule }) => {
    const doc = Array.isArray(documents) ? documents[0] : documents;
    const client = Array.isArray(doc?.clients) ? doc?.clients[0] : doc?.clients;
    return {
      ...schedule,
      template_doc_number: doc?.doc_number ?? '',
      client_name: client?.display_name ?? doc?.client_name_snapshot ?? null,
    };
  });
}

/** Creates or replaces the schedule for an invoice, restarting it from `startDate`. Any period
 * that's already due (a start date of today or earlier) is generated immediately rather than
 * waiting for the daily server job. Returns how many drafts were created right away. */
export async function saveSchedule(
  documentId: string,
  frequency: RecurrenceFrequency,
  startDate: string
): Promise<number> {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const { error } = await supabase.from('recurring_schedules').upsert(
    {
      owner_id: ownerId,
      template_document_id: documentId,
      frequency,
      start_date: startDate,
      next_run_date: startDate,
      runs_count: 0,
      is_active: 1,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'template_document_id' }
  );
  if (error) throw error;
  return generateDueRecurringInvoices();
}

export async function stopSchedule(documentId: string): Promise<void> {
  const { error } = await supabase.from('recurring_schedules').delete().eq('template_document_id', documentId);
  if (error) throw error;
}

/** Creates drafts for any of this business's schedules that have come due. The server also runs
 * this daily; calling it on launch just means drafts show up without waiting for that job. */
export async function generateDueRecurringInvoices(): Promise<number> {
  const { data, error } = await supabase.rpc('generate_my_recurring_invoices');
  if (error) throw error;
  return (data as number) ?? 0;
}
