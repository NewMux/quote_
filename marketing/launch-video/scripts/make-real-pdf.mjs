// Builds the invoice PDF's HTML with the app's own template (src/lib/pdf/htmlTemplate.ts), filled
// with sample data, into src/store/generated/invoiceHtml.ts: one version in English and one in
// Arabic (right to left). The App Store screenshots show it as is, so the PDF in them is the app's
// real output, not a redraw. Run: node scripts/make-real-pdf.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

// The template reads the app's language through expo-localization, which doesn't exist in Node, so
// each build swaps in a stub that reports the language being rendered.
const stubDir = resolve(root, 'node_modules/.cache');

async function loadTemplate(lang) {
  const stub = resolve(stubDir, `stub-${lang}.mjs`);
  writeFileSync(stub, `export const I18nManager = { isRTL: ${lang === 'ar'} };\nexport const getLocales = () => [{ languageCode: '${lang}' }];\n`);
  const outfile = resolve(stubDir, `htmlTemplate-${lang}.mjs`);
  await build({
    entryPoints: [resolve(root, '../../src/lib/pdf/htmlTemplate.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    alias: { 'react-native': stub, 'expo-localization': stub },
    nodePaths: [resolve(root, 'node_modules')],
    logLevel: 'error',
  });
  return (await import(pathToFileURL(outfile).href)).buildDocumentHtml;
}

const stamp = '2026-10-14T09:00:00.000Z';
const png = readFileSync(resolve(root, 'scripts/assets/signature.png')).toString('base64');

// One small studio, in each language. The amounts add up to the Summary screen's INV-0042.
const SAMPLE = {
  en: {
    taxName: 'Sales Tax',
    currency: 'USD',
    lines: [['Website redesign', 1, 240000], ['Brand photography', 2, 45000], ['Monthly retainer', 1, 60000]],
    business: { name: 'Northwind Studio', email: 'hello@northwind.studio', phone: '+1 (555) 014-2280', address: '88 Mercer St, NYC', terms: 'Payment due within 14 days. Thank you for your business!' },
    client: { name: 'Harbor Coffee Co.', contact: 'Lina Haddad', email: 'lina@harborcoffee.co', phone: '+1 (555) 019-3347', address: '14 Harbor St, Boston' },
  },
  ar: {
    taxName: 'ضريبة المبيعات',
    currency: 'AED',
    lines: [['تصميم موقع إلكتروني', 1, 240000], ['تصوير فوتوغرافي للعلامة', 2, 45000], ['اشتراك شهري', 1, 60000]],
    business: { name: 'استوديو الشمال', email: 'hello@northwind.studio', phone: '+971 4 014 2280', address: 'شارع الشيخ زايد، دبي', terms: 'الدفع خلال 14 يومًا. شكرًا لتعاملكم معنا!' },
    client: { name: 'مقهى الميناء', contact: 'لينا حداد', email: 'lina@harborcoffee.co', phone: '+971 50 019 3347', address: 'شارع الكورنيش، أبوظبي' },
  },
};

async function render(lang) {
  const buildDocumentHtml = await loadTemplate(lang);
  const d = SAMPLE[lang];
  const base = { document_id: 'd1', catalog_item_id: null, discount_type: null, discount_value: null, is_taxable: 1, tax_bracket_id: 't1', tax_bracket_name_snapshot: d.taxName, tax_rate_bp: 1000, line_discount_minor: 0, created_at: stamp, updated_at: stamp };
  const line = (position, [description, quantity, unit]) => {
    const sub = quantity * unit;
    const tax = Math.round(sub * 0.1);
    return { ...base, id: `l${position}`, position, description, quantity, unit_label: null, unit_price_minor: unit, line_subtotal_minor: sub, line_tax_minor: tax, line_total_minor: sub + tax };
  };
  return buildDocumentHtml({
    document: {
      id: 'd1', doc_type: 'invoice', doc_number: 'INV-0042', status: 'issued', viewed_at: null, client_id: 'c1',
      client_name_snapshot: d.client.name, issue_date: '2026-10-14', due_date: '2026-10-28', expiry_date: null,
      currency_code: d.currency, subtotal_minor: 390000, discount_type: null, discount_value: null, discount_amount_minor: 0,
      tax_total_minor: 39000, total_minor: 429000, amount_paid_minor: 0, notes: null, terms_override: null, payment_link: null,
      converted_from_document_id: null, converted_to_document_id: null, voided_at: null, void_reason: null, pdf_uri: null,
      created_at: stamp, updated_at: stamp,
    },
    lines: d.lines.map((l, i) => line(i, l)),
    profile: {
      id: 1, business_name: d.business.name, logo_uri: null, accent_color: '#12112B', email: d.business.email,
      phone: d.business.phone, address: d.business.address, tax_registration_number: null,
      payment_instructions: null, payment_link: 'https://paypal.me/northwind/{amount}', footer_terms: d.business.terms,
      default_currency_code: d.currency, default_payment_terms_days: 14, estimate_prefix: 'EST-', invoice_prefix: 'INV-', number_padding: 4,
      reset_numbering_yearly: 0, created_at: stamp, updated_at: stamp,
    },
    client: {
      id: 'c1', display_name: d.client.name, contact_name: d.client.contact, email: d.client.email, phone: d.client.phone,
      address: d.client.address, tax_registration_number: null, notes: null, photo_uri: null, is_archived: 0, created_at: stamp, updated_at: stamp,
    },
    signatures: [
      { id: 's1', document_id: 'd1', signer_role: 'merchant', signer_name: null, signature_image_uri: '', signed_at: stamp, created_at: stamp },
      { id: 's2', document_id: 'd1', signer_role: 'client', signer_name: null, signature_image_uri: '', signed_at: '2026-10-15T14:30:00.000Z', created_at: stamp },
    ],
    logoBase64: null,
    signatureImagesBase64: { s1: png, s2: png },
  });
}

const en = await render('en');
const ar = await render('ar');
writeFileSync(
  resolve(root, 'src/store/generated/invoiceHtml.ts'),
  `// Generated by scripts/make-real-pdf.mjs from the app's src/lib/pdf/htmlTemplate.ts. Don't edit.\nexport const INVOICE_HTML = ${JSON.stringify(en)};\nexport const INVOICE_HTML_AR = ${JSON.stringify(ar)};\n`
);
console.log('invoiceHtml.ts', en.length, 'and', ar.length, 'chars');
