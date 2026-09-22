import type { DocumentRecord, DocumentListItem } from '../types/models';

export type DisplayStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';

type StatusInput = Pick<
  DocumentRecord | DocumentListItem,
  'status' | 'due_date' | 'total_minor' | 'amount_paid_minor'
>;

/** Overdue is never persisted — it's derived at render time since there's no background job to keep it fresh. */
export function getDisplayStatus(doc: StatusInput): DisplayStatus {
  if (doc.status === 'issued' || doc.status === 'partially_paid') {
    if (doc.due_date && doc.due_date < todayIso() && doc.amount_paid_minor < doc.total_minor) {
      return 'overdue';
    }
  }
  return doc.status;
}

export function isOverdue(doc: StatusInput): boolean {
  return getDisplayStatus(doc) === 'overdue';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function canEdit(doc: Pick<DocumentRecord, 'status'>): boolean {
  return doc.status === 'draft';
}

export function canDelete(doc: Pick<DocumentRecord, 'converted_to_document_id'>): boolean {
  return !doc.converted_to_document_id;
}

export function canIssue(doc: Pick<DocumentRecord, 'status'>): boolean {
  return doc.status === 'draft';
}

export function canVoid(doc: Pick<DocumentRecord, 'status'>): boolean {
  return doc.status === 'draft' || doc.status === 'issued' || doc.status === 'partially_paid';
}

export function canLogSettlement(doc: Pick<DocumentRecord, 'doc_type' | 'status'>): boolean {
  return doc.doc_type === 'invoice' && (doc.status === 'issued' || doc.status === 'partially_paid');
}

export function canConvertToInvoice(
  doc: Pick<DocumentRecord, 'doc_type' | 'status' | 'converted_to_document_id'>
): boolean {
  return (
    doc.doc_type === 'estimate' &&
    (doc.status === 'draft' || doc.status === 'issued') &&
    !doc.converted_to_document_id
  );
}

export function canMarkViewed(doc: Pick<DocumentRecord, 'status' | 'viewed_at'>): boolean {
  return doc.status !== 'void' && doc.status !== 'draft' && !doc.viewed_at;
}

export function statusLabel(status: DisplayStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'issued':
      return 'Issued';
    case 'partially_paid':
      return 'Partially Paid';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'void':
      return 'Canceled';
  }
}
