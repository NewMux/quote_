import * as Print from 'expo-print';
import { getBusinessProfile } from '../../db/repositories/businessProfile.repo';
import { getClient } from '../../db/repositories/clients.repo';
import { getDocument, setPdfUri } from '../../db/repositories/documents.repo';
import { listLineItems } from '../../db/repositories/lineItems.repo';
import { listSignatures } from '../../db/repositories/signatures.repo';
import { readFileAsBase64, persistPickedFile } from '../fileStorage';
import { buildDocumentHtml } from './htmlTemplate';

/** Renders the document to a PDF, persists it into app storage, records its uri on the
 * document row, and returns the final file:// uri. */
export async function generateDocumentPdf(documentId: string): Promise<string> {
  const document = await getDocument(documentId);
  if (!document) throw new Error('Document not found');

  const [profile, lines, signatures] = await Promise.all([
    getBusinessProfile(),
    listLineItems(documentId),
    listSignatures(documentId),
  ]);
  const client = document.client_id ? await getClient(document.client_id) : null;

  const logoBase64 = profile.logo_uri ? await readFileAsBase64(profile.logo_uri) : null;

  const signatureImagesBase64: Record<string, string> = {};
  for (const sig of signatures) {
    signatureImagesBase64[sig.id] = await readFileAsBase64(sig.signature_image_uri);
  }

  const html = buildDocumentHtml({
    document,
    lines,
    profile,
    client,
    signatures,
    logoBase64,
    signatureImagesBase64,
  });

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const persistedUri = await persistPickedFile(uri, 'pdfs', `${document.doc_number}.pdf`);
  await setPdfUri(documentId, persistedUri);
  return persistedUri;
}
