import type { SQLiteDatabase } from 'expo-sqlite';
import { newId, nowIso } from '../../lib/id';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE business_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT '',
      logo_uri TEXT,
      accent_color TEXT NOT NULL DEFAULT '#2563EB',
      email TEXT, phone TEXT, address TEXT,
      tax_registration_number TEXT,
      payment_instructions TEXT,
      footer_terms TEXT,
      default_currency_code TEXT NOT NULL DEFAULT 'USD',
      default_payment_terms_days INTEGER NOT NULL DEFAULT 14,
      estimate_prefix TEXT NOT NULL DEFAULT 'EST-',
      invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
      number_padding INTEGER NOT NULL DEFAULT 3,
      reset_numbering_yearly INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );

    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      contact_name TEXT, email TEXT, phone TEXT, address TEXT,
      tax_registration_number TEXT, notes TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_clients_display_name ON clients(display_name COLLATE NOCASE);

    CREATE TABLE tax_brackets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate_bp INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );

    CREATE TABLE item_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      default_unit_price_minor INTEGER NOT NULL DEFAULT 0,
      unit_label TEXT NOT NULL DEFAULT 'unit',
      is_taxable INTEGER NOT NULL DEFAULT 1,
      default_tax_bracket_id TEXT REFERENCES tax_brackets(id) ON DELETE SET NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_item_catalog_name ON item_catalog(name COLLATE NOCASE);

    CREATE TABLE doc_counters (
      doc_type TEXT NOT NULL CHECK (doc_type IN ('estimate','invoice')),
      year_bucket INTEGER NOT NULL DEFAULT 0,
      next_number INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (doc_type, year_bucket)
    );

    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      doc_type TEXT NOT NULL CHECK (doc_type IN ('estimate','invoice')),
      doc_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','issued','partially_paid','paid','void')),
      viewed_at TEXT,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      client_name_snapshot TEXT,
      issue_date TEXT, due_date TEXT, expiry_date TEXT,
      currency_code TEXT NOT NULL,
      subtotal_minor INTEGER NOT NULL DEFAULT 0,
      discount_type TEXT CHECK (discount_type IN ('percent','fixed')),
      discount_value INTEGER,
      discount_amount_minor INTEGER NOT NULL DEFAULT 0,
      tax_total_minor INTEGER NOT NULL DEFAULT 0,
      total_minor INTEGER NOT NULL DEFAULT 0,
      amount_paid_minor INTEGER NOT NULL DEFAULT 0,
      notes TEXT, terms_override TEXT,
      converted_from_document_id TEXT REFERENCES documents(id),
      converted_to_document_id TEXT REFERENCES documents(id),
      voided_at TEXT, void_reason TEXT,
      pdf_uri TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX idx_documents_doc_number ON documents(doc_number);
    CREATE INDEX idx_documents_status ON documents(status);
    CREATE INDEX idx_documents_client_id ON documents(client_id);
    CREATE INDEX idx_documents_doc_type ON documents(doc_type);

    CREATE TABLE line_items (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      catalog_item_id TEXT REFERENCES item_catalog(id) ON DELETE SET NULL,
      position INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_label TEXT,
      unit_price_minor INTEGER NOT NULL DEFAULT 0,
      discount_type TEXT CHECK (discount_type IN ('percent','fixed')),
      discount_value INTEGER,
      is_taxable INTEGER NOT NULL DEFAULT 1,
      tax_bracket_id TEXT REFERENCES tax_brackets(id) ON DELETE SET NULL,
      tax_bracket_name_snapshot TEXT,
      tax_rate_bp INTEGER NOT NULL DEFAULT 0,
      line_subtotal_minor INTEGER NOT NULL DEFAULT 0,
      line_discount_minor INTEGER NOT NULL DEFAULT 0,
      line_tax_minor INTEGER NOT NULL DEFAULT 0,
      line_total_minor INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX idx_line_items_document_id ON line_items(document_id);

    CREATE TABLE signatures (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      signer_role TEXT NOT NULL CHECK (signer_role IN ('merchant','client')),
      signer_name TEXT,
      signature_image_uri TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX idx_signatures_doc_role ON signatures(document_id, signer_role);

    CREATE TABLE settlements (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      method TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','check','other')),
      amount_minor INTEGER NOT NULL,
      settled_date TEXT NOT NULL,
      reference_number TEXT,
      receipt_photo_uri TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX idx_settlements_document_id ON settlements(document_id);

    CREATE TABLE activity_logs (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN (
        'created','edited','issued','viewed_marked','shared','emailed',
        'signed_merchant','signed_client','settlement_logged','status_changed',
        'converted_to_invoice','voided'
      )),
      event_detail TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX idx_activity_logs_document_id ON activity_logs(document_id);
  `);

  const now = nowIso();
  await db.runAsync(
    `INSERT INTO business_profile (id, business_name, accent_color, default_currency_code, created_at, updated_at)
     VALUES (1, '', '#2563EB', 'USD', ?, ?)`,
    [now, now]
  );

  await db.runAsync(
    `INSERT INTO tax_brackets (id, name, rate_bp, is_default, created_at, updated_at)
     VALUES (?, 'No Tax', 0, 1, ?, ?)`,
    [newId(), now, now]
  );
}
