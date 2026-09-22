import { supabase } from '../../lib/supabase';
import { newId, nowIso } from '../../lib/id';
import { deleteFileIfExists } from '../../lib/fileStorage';
import { requireOwnerId } from '../ownerId';
import type { SignatureRecord, SignerRole } from '../../types/models';

export async function listSignatures(documentId: string): Promise<SignatureRecord[]> {
  const { data, error } = await supabase.from('signatures').select('*').eq('document_id', documentId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertSignature(
  documentId: string,
  role: SignerRole,
  imageUri: string,
  signerName?: string | null
): Promise<void> {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const { error } = await supabase.from('signatures').upsert(
    {
      id: newId(),
      owner_id: ownerId,
      document_id: documentId,
      signer_role: role,
      signer_name: signerName ?? null,
      signature_image_uri: imageUri,
      signed_at: now,
      created_at: now,
    },
    { onConflict: 'document_id,signer_role' }
  );
  if (error) throw error;
}

export async function deleteSignature(documentId: string, role: SignerRole): Promise<void> {
  const { data: signature } = await supabase
    .from('signatures')
    .select('signature_image_uri')
    .eq('document_id', documentId)
    .eq('signer_role', role)
    .maybeSingle();
  const { error } = await supabase.from('signatures').delete().eq('document_id', documentId).eq('signer_role', role);
  if (error) throw error;
  await deleteFileIfExists(signature?.signature_image_uri ?? null);
}
