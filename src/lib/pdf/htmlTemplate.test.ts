import { buildDocumentHtml } from './htmlTemplate';
import type { BusinessProfile, Client, DocumentRecord, LineItem } from '../../types/models';

const stamp = '2026-10-14T09:00:00.000Z';
const EVIL = `<script>alert(1)</script><img src=x onerror=alert(2)>"'&`;

const document = {
  id: 'd1', doc_type: 'invoice', doc_number: EVIL, status: 'issued', viewed_at: null, client_id: 'c1',
  client_name_snapshot: EVIL, issue_date: '2026-10-14', due_date: '2026-10-28', expiry_date: null,
  currency_code: 'USD', subtotal_minor: 1000, discount_type: null, discount_value: null, discount_amount_minor: 0,
  tax_total_minor: 0, total_minor: 1000, amount_paid_minor: 0, notes: EVIL, terms_override: EVIL, payment_link: null,
  converted_from_document_id: null, converted_to_document_id: null, voided_at: null, void_reason: null, pdf_uri: null,
  created_at: stamp, updated_at: stamp,
} as unknown as DocumentRecord;

const line = {
  id: 'l1', document_id: 'd1', catalog_item_id: null, position: 0, description: EVIL, quantity: 1, unit_label: EVIL,
  unit_price_minor: 1000, discount_type: null, discount_value: null, is_taxable: 1, tax_bracket_id: 't1',
  tax_bracket_name_snapshot: EVIL, tax_rate_bp: 1000, line_subtotal_minor: 1000, line_discount_minor: 0,
  line_tax_minor: 100, line_total_minor: 1100, created_at: stamp, updated_at: stamp,
} as unknown as LineItem;

const profile = {
  id: 1, business_name: EVIL, logo_uri: null, accent_color: '#157A63', email: EVIL, phone: EVIL, address: EVIL,
  tax_registration_number: EVIL, payment_instructions: EVIL, payment_link: null, footer_terms: EVIL,
  default_currency_code: 'USD', default_payment_terms_days: 14, estimate_prefix: 'EST-', invoice_prefix: 'INV-',
  number_padding: 4, reset_numbering_yearly: 0, created_at: stamp, updated_at: stamp,
} as unknown as BusinessProfile;

const client = {
  id: 'c1', display_name: EVIL, contact_name: EVIL, email: EVIL, phone: EVIL, address: EVIL, tax_registration_number: null,
  notes: null, photo_uri: null, is_archived: 0, created_at: stamp, updated_at: stamp,
} as unknown as Client;

const build = (overrides: Partial<DocumentRecord> = {}, profileOverrides: Partial<BusinessProfile> = {}) =>
  buildDocumentHtml({
    document: { ...document, ...overrides },
    lines: [line],
    profile: { ...profile, ...profileOverrides },
    client,
    signatures: [],
    logoBase64: null,
    signatureImagesBase64: {},
  });

describe('buildDocumentHtml with hostile text', () => {
  it('never lets typed text become markup', () => {
    const html = build();
    expect(html).not.toContain('<script>alert(1)');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('only ever links to an http(s) payment page', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', 'mailto:a@b.co', 'https://a b.co']) {
      const html = build({ payment_link: bad });
      expect(html).not.toMatch(/href="(javascript|data|file|mailto):/i);
      expect(html).not.toContain('class="pay"');
    }
    expect(build({ payment_link: 'https://paypal.me/x/{amount}' })).toContain('href="https://paypal.me/x/10.00"');
  });

  it('keeps a quote or angle bracket in the payment link from escaping its attribute', () => {
    const html = build({ payment_link: 'https://pay.example.com/x"><script>alert(1)</script>' });
    expect(html).not.toContain('"><script>');
  });
});
