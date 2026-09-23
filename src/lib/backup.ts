import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import { requireOwnerId } from '../db/ownerId';

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

/** Fetches every table this business owns from Supabase and hands the result to the OS share
 * sheet as a JSON file. Signatures/receipt photos/PDFs/logo live in Supabase Storage and appear
 * here only as their storage paths, not as bundled file contents. */
export async function exportBackup(businessName: string | null): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
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
    const { data, error } = await supabase.from(table).select('*').eq('owner_id', ownerId);
    if (error) throw error;
    backup[table] = data ?? [];
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizeFileNamePart(businessName ?? 'InvoiceThem')}-Backup-${dateStamp}.json`;
  const dest = new File(Paths.cache, fileName);
  dest.write(JSON.stringify(backup, null, 2));

  await Sharing.shareAsync(dest.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save backup',
  });
}
