import type { SQLiteDatabase } from 'expo-sqlite';

/** documents.converted_from_document_id / converted_to_document_id were created with no
 * ON DELETE action, so SQLite blocked deleting either side of a completed conversion
 * (error 19). Rebuilds the table with ON DELETE SET NULL on both self-referencing columns —
 * SQLite has no ALTER TABLE ... ALTER COLUMN, so this follows SQLite's documented 12-step
 * table-rebuild recipe. Renaming documents_new back to documents auto-rewrites the
 * self-referencing FK text to the final name. */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys=OFF;
    BEGIN TRANSACTION;

    CREATE TABLE documents_new (
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
      converted_from_document_id TEXT REFERENCES documents_new(id) ON DELETE SET NULL,
      converted_to_document_id TEXT REFERENCES documents_new(id) ON DELETE SET NULL,
      voided_at TEXT, void_reason TEXT,
      pdf_uri TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );

    INSERT INTO documents_new SELECT
      id, doc_type, doc_number, status, viewed_at, client_id, client_name_snapshot,
      issue_date, due_date, expiry_date, currency_code, subtotal_minor, discount_type,
      discount_value, discount_amount_minor, tax_total_minor, total_minor, amount_paid_minor,
      notes, terms_override, converted_from_document_id, converted_to_document_id,
      voided_at, void_reason, pdf_uri, created_at, updated_at
    FROM documents;

    DROP TABLE documents;
    ALTER TABLE documents_new RENAME TO documents;

    CREATE UNIQUE INDEX idx_documents_doc_number ON documents(doc_number);
    CREATE INDEX idx_documents_status ON documents(status);
    CREATE INDEX idx_documents_client_id ON documents(client_id);
    CREATE INDEX idx_documents_doc_type ON documents(doc_type);

    COMMIT;
    PRAGMA foreign_keys=ON;
  `);
}
