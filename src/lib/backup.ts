import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import { requireOwnerId } from '../db/ownerId';
import { t } from './i18n';

function sanitizeFileNamePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'InvoiceThem';
}

const OWNER_SCOPED_TABLES = [
  'clients',
  'tax_brackets',
  'item_catalog',
  'doc_counters',
  'documents',
  'line_items',
  'signatures',
  'settlements',
  'activity_logs',
  'recurring_schedules',
] as const;

const PAGE_SIZE = 1000;

/** Supabase returns at most 1,000 rows per request without saying so, so each table is paged,
 * in a stable order, until a short page comes back. doc_counters has no id column (its key is
 * owner/type/year) and only a handful of rows. */
async function fetchAllRows(table: (typeof OWNER_SCOPED_TABLES)[number], ownerId: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const query = supabase.from(table).select('*').eq('owner_id', ownerId);
    const ordered = table === 'doc_counters' ? query.order('doc_type').order('year_bucket') : query.order('id');
    const { data, error } = await ordered.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

/** Fetches every table this business owns from Supabase and hands the result to the OS share
 * sheet as a JSON file. Signatures/receipt photos/PDFs/logo live in Supabase Storage and appear
 * here only as their storage paths, not as bundled file contents. */
export async function exportBackup(businessName: string | null): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(t('Sharing is not available on this device.'));
  }

  const ownerId = requireOwnerId();
  const backup: Record<string, unknown> = { exportedAt: new Date().toISOString() };

  const { data: profile, error: profileError } = await supabase
    .from('business_profile')
    .select('*')
    .eq('id', ownerId)
    .maybeSingle();
  if (profileError) throw profileError;
  backup.business_profile = profile;

  for (const table of OWNER_SCOPED_TABLES) {
    backup[table] = await fetchAllRows(table, ownerId);
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizeFileNamePart(businessName ?? 'InvoiceThem')}-Backup-${dateStamp}.json`;
  const dest = new File(Paths.cache, fileName);
  dest.write(JSON.stringify(backup, null, 2));

  try {
    await Sharing.shareAsync(dest.uri, {
      mimeType: 'application/json',
      dialogTitle: t('Save backup'),
    });
  } finally {
    // The file holds every client's details; don't leave a copy in the app's cache.
    try {
      dest.delete();
    } catch {
      // Already gone.
    }
  }
}
