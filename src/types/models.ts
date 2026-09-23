export type DiscountType = 'percent' | 'fixed';

export type DocType = 'estimate' | 'invoice';

export type DocStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';

export type SettlementMethod = 'cash' | 'bank_transfer' | 'check' | 'other';

export type SignerRole = 'merchant' | 'client';

export type ActivityEventType =
  | 'created'
  | 'edited'
  | 'issued'
  | 'viewed_marked'
  | 'shared'
  | 'emailed'
  | 'signed_merchant'
  | 'signed_client'
  | 'settlement_logged'
  | 'status_changed'
  | 'converted_to_invoice'
  | 'voided';

export interface BusinessProfile {
  id: 1;
  business_name: string;
  logo_uri: string | null;
  accent_color: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_registration_number: string | null;
  payment_instructions: string | null;
  footer_terms: string | null;
  default_currency_code: string;
  default_payment_terms_days: number;
  estimate_prefix: string;
  invoice_prefix: string;
  number_padding: number;
  reset_numbering_yearly: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  display_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_registration_number: string | null;
  notes: string | null;
  photo_uri: string | null;
  is_archived: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface TaxBracket {
  id: string;
  name: string;
  rate_bp: number;
  is_default: 0 | 1;
  is_archived: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface ItemCatalogEntry {
  id: string;
  name: string;
  description: string | null;
  default_unit_price_minor: number;
  unit_label: string;
  is_taxable: 0 | 1;
  default_tax_bracket_id: string | null;
  is_archived: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  doc_type: DocType;
  doc_number: string;
  status: DocStatus;
  viewed_at: string | null;
  client_id: string | null;
  client_name_snapshot: string | null;
  issue_date: string | null;
  due_date: string | null;
  expiry_date: string | null;
  currency_code: string;
  subtotal_minor: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  discount_amount_minor: number;
  tax_total_minor: number;
  total_minor: number;
  amount_paid_minor: number;
  notes: string | null;
  terms_override: string | null;
  converted_from_document_id: string | null;
  converted_to_document_id: string | null;
  voided_at: string | null;
  void_reason: string | null;
  pdf_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  document_id: string;
  catalog_item_id: string | null;
  position: number;
  description: string;
  quantity: number;
  unit_label: string | null;
  unit_price_minor: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  is_taxable: 0 | 1;
  tax_bracket_id: string | null;
  tax_bracket_name_snapshot: string | null;
  tax_rate_bp: number;
  line_subtotal_minor: number;
  line_discount_minor: number;
  line_tax_minor: number;
  line_total_minor: number;
  created_at: string;
  updated_at: string;
}

export interface SignatureRecord {
  id: string;
  document_id: string;
  signer_role: SignerRole;
  signer_name: string | null;
  signature_image_uri: string;
  signed_at: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  document_id: string;
  method: SettlementMethod;
  amount_minor: number;
  settled_date: string;
  reference_number: string | null;
  receipt_photo_uri: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  document_id: string;
  event_type: ActivityEventType;
  event_detail: string | null;
  created_at: string;
}

/** Shape used by the document editor and passed into documentCalculations — a superset of
 * LineItemDraft (structurally compatible) plus the persistence-only fields the repo needs. */
export interface LineItemEditable {
  id: string;
  catalogItemId: string | null;
  description: string;
  quantity: number;
  unitLabel: string | null;
  unitPriceMinor: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  isTaxable: boolean;
  taxBracketId: string | null;
  taxBracketNameSnapshot: string | null;
  taxRateBp: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface DocumentListItem {
  id: string;
  doc_type: DocType;
  doc_number: string;
  status: DocStatus;
  viewed_at: string | null;
  client_id: string | null;
  client_name: string | null;
  issue_date: string | null;
  due_date: string | null;
  total_minor: number;
  amount_paid_minor: number;
  currency_code: string;
  converted_to_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringSchedule {
  id: string;
  owner_id: string;
  template_document_id: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  next_run_date: string;
  runs_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/** A schedule plus the template invoice's number and client, for the Recurring Invoices list. */
export interface RecurringScheduleListItem extends RecurringSchedule {
  template_doc_number: string;
  client_name: string | null;
}
