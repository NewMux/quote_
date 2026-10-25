import { supabase } from './supabase';
import { requireOwnerId } from '../db/ownerId';

export type StorageCategory = 'branding' | 'signatures' | 'receipts' | 'pdfs' | 'client-photos';

const BUCKET = 'user-files';

function contentTypeFor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

/** Uploads a transient picker/cache local file:// uri into the signed-in business's private
 * Storage folder and returns the storage object path — not a URL. Resolve a displayable/
 * downloadable URL with getSignedUrl (or the useSignedUrl hook) when the file is actually needed. */
export async function persistPickedFile(
  sourceUri: string,
  category: StorageCategory,
  fileName: string
): Promise<string> {
  const ownerId = requireOwnerId();
  const path = `${ownerId}/${category}/${fileName}`;
  const arrayBuffer = await fetch(sourceUri).then((res) => res.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: contentTypeFor(fileName), upsert: true });
  if (error) throw error;
  return path;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });
}

export async function readFileAsBase64(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return blobToBase64(data);
}

/** Best effort: callers run this to clean up after a database change that already succeeded, so
 * a file that won't delete is left as an orphan (Delete All Data and account deletion still sweep
 * the whole folder) rather than reported as a failed save. */
export async function deleteFileIfExists(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

const LIST_PAGE_SIZE = 1000;

/** Every file path under a folder, including nested folders. Storage's list() returns one level
 * at a time and only 100 entries unless asked for more, so it's walked and paged. */
async function listAllPaths(folder: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: LIST_PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    for (const entry of data) {
      const path = `${folder}/${entry.name}`;
      // Folders come back with no id.
      if (entry.id) paths.push(path);
      else paths.push(...(await listAllPaths(path)));
    }
    if (data.length < LIST_PAGE_SIZE) return paths;
  }
}

/** Deletes every file this business owns from Storage. */
export async function wipeAllFiles(): Promise<void> {
  const paths = await listAllPaths(requireOwnerId());
  for (let i = 0; i < paths.length; i += LIST_PAGE_SIZE) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + LIST_PAGE_SIZE));
    if (error) throw error;
  }
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Resolves a temporary, directly-fetchable URL for a stored file path. The bucket is private, so
 * every display/download needs a fresh signed URL rather than the path itself. */
export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
