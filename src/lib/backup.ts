import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../db/client';

function sanitizeFileNamePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Quote';
}

/** Copies the live SQLite database (clients, documents, line items, tax rates, item catalog,
 * business profile, settlements, activity log) to a shareable file and hands it to the OS share
 * sheet. Signatures/receipt photos/PDFs/logo aren't included — those are separate files under
 * Paths.document, referenced by URI from the DB, not bundled here. */
export async function exportBackup(businessName: string | null): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  // Defensive no-op outside WAL mode (this app never enables it) — cheap insurance that the
  // main .db file is a complete, checkpointed snapshot before it's copied.
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');

  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizeFileNamePart(businessName ?? 'Quote')}-Backup-${dateStamp}.db`;
  const dest = new File(Paths.cache, fileName);
  // db.databasePath is a plain filesystem path (no file:// scheme) — expo-file-system's File
  // expects a proper URI.
  const sourceUri = db.databasePath.startsWith('file://') ? db.databasePath : `file://${db.databasePath}`;
  const source = new File(sourceUri);
  await source.copy(dest, { overwrite: true });

  await Sharing.shareAsync(dest.uri, {
    mimeType: 'application/x-sqlite3',
    dialogTitle: 'Save backup',
  });
}
