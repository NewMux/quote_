import { db } from '../client';
import { newId, nowIso } from '../../lib/id';
import type { SignatureRecord, SignerRole } from '../../types/models';

export async function listSignatures(documentId: string): Promise<SignatureRecord[]> {
  return db.getAllAsync<SignatureRecord>('SELECT * FROM signatures WHERE document_id = ?', [
    documentId,
  ]);
}

export async function upsertSignature(
  documentId: string,
  role: SignerRole,
  imageUri: string,
  signerName?: string | null
): Promise<void> {
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO signatures (id, document_id, signer_role, signer_name, signature_image_uri, signed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(document_id, signer_role) DO UPDATE SET
       signer_name = excluded.signer_name,
       signature_image_uri = excluded.signature_image_uri,
       signed_at = excluded.signed_at`,
    [newId(), documentId, role, signerName ?? null, imageUri, now, now]
  );
}

export async function deleteSignature(documentId: string, role: SignerRole): Promise<void> {
  await db.runAsync('DELETE FROM signatures WHERE document_id = ? AND signer_role = ?', [documentId, role]);
}
