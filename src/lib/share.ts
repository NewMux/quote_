import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { logActivity } from '../db/repositories/activityLog.repo';

export async function sharePdf(documentId: string, pdfUri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share document',
  });
  await logActivity(documentId, 'shared');
}

export interface EmailPdfInput {
  documentId: string;
  pdfUri: string;
  recipientEmail: string | null;
  subject: string;
  body: string;
}

/** Composes an email with the PDF attached via the device's mail app. Falls back to the generic
 * share sheet when no mail account is configured (common on Android emulators/devices). */
export async function emailPdf(input: EmailPdfInput): Promise<'emailed' | 'shared'> {
  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    await sharePdf(input.documentId, input.pdfUri);
    return 'shared';
  }

  await MailComposer.composeAsync({
    recipients: input.recipientEmail ? [input.recipientEmail] : [],
    subject: input.subject,
    body: input.body,
    attachments: [input.pdfUri],
  });
  await logActivity(input.documentId, 'emailed');
  return 'emailed';
}
