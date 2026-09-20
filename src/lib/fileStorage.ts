import { Directory, File, Paths } from 'expo-file-system';

export type StorageCategory = 'branding' | 'signatures' | 'receipts' | 'pdfs' | 'client-photos';

function categoryDir(category: StorageCategory): Directory {
  const dir = new Directory(Paths.document, category);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/** Copies a transient picker/cache URI into permanent app storage and returns the new file:// uri. */
export async function persistPickedFile(
  sourceUri: string,
  category: StorageCategory,
  fileName: string
): Promise<string> {
  const dir = categoryDir(category);
  const dest = new File(dir, fileName);
  const source = new File(sourceUri);
  await source.copy(dest, { overwrite: true });
  return dest.uri;
}

export async function readFileAsBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

export function deleteFileIfExists(uri: string | null | undefined): void {
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
