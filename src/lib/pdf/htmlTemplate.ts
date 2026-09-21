import { format, parseISO } from 'date-fns';
import { formatMinor, formatRateBp } from '../money';
import type { BusinessProfile, Client, DocumentRecord, LineItem, SignatureRecord } from '../../types/models';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BuildDocumentHtmlInput {
  document: DocumentRecord;
  lines: LineItem[];
  profile: BusinessProfile;
  client: Client | null;
  signatures: SignatureRecord[];
  logoBase64: string | null;
  /** signature record id -> base64 PNG, pre-read by the caller (generatePdf.ts) since the
   * print WebView shouldn't be relied on to resolve local file:// image sources. */
  signatureImagesBase64: Record<string, string>;
}

export function buildDocumentHtml(input: BuildDocumentHtmlInput): string {
  const { document, lines, profile, client, signatures, logoBase64, signatureImagesBase64 } = input;
  const accent = profile.accent_color || '#2563EB';
  const docTitle = document.doc_type === 'estimate' ? 'Estimate' : 'Invoice';

  const merchantSig = signatures.find((s) => s.signer_role === 'merchant');
  const clientSig = signatures.find((s) => s.signer_role === 'client');

  const rowsHtml = lines
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.description)}</td>
        <td class="num">${l.quantity}${l.unit_label ? ` ${escapeHtml(l.unit_label)}` : ''}</td>
        <td class="num">${formatMinor(l.unit_price_minor, document.currency_code)}</td>
        <td class="num">${l.tax_rate_bp > 0 ? formatRateBp(l.tax_rate_bp) : '—'}</td>
        <td class="num">${formatMinor(l.line_total_minor, document.currency_code)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1f2937; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .logo { max-height: 64px; max-width: 200px; }
  .doc-title { font-size: 28px; font-weight: 700; color: ${accent}; margin: 0; }
  .doc-number { font-size: 14px; color: #6b7280; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
  .two-col { display: flex; justify-content: space-between; gap: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding: 8px 4px; }
  td { padding: 8px 4px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .num { text-align: right; }
  .totals { margin-top: 16px; margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .totals-row.total { font-size: 16px; font-weight: 700; border-top: 2px solid ${accent}; margin-top: 6px; padding-top: 8px; }
  .footer { margin-top: 32px; font-size: 12px; color: #6b7280; white-space: pre-wrap; }
  .signatures { display: flex; gap: 32px; margin-top: 40px; }
  .signature-block { flex: 1; }
  .signature-block img { max-height: 60px; }
  .signature-line { border-top: 1px solid #9ca3af; margin-top: 4px; padding-top: 4px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <div>
      ${logoBase64 ? `<img class="logo" src="data:image/png;base64,${logoBase64}" />` : `<div style="font-size:20px;font-weight:700;">${escapeHtml(profile.business_name || 'Your Business')}</div>`}
    </div>
    <div style="text-align:right;">
      <p class="doc-title">${docTitle}</p>
      <div class="doc-number">${escapeHtml(document.doc_number)}</div>
    </div>
  </div>

  <div class="two-col section">
    <div>
      <div class="section-title">From</div>
      <div>${escapeHtml(profile.business_name || '')}</div>
      ${profile.address ? `<div>${escapeHtml(profile.address)}</div>` : ''}
      ${profile.email ? `<div>${escapeHtml(profile.email)}</div>` : ''}
      ${profile.phone ? `<div>${escapeHtml(profile.phone)}</div>` : ''}
      ${profile.tax_registration_number ? `<div>Tax ID: ${escapeHtml(profile.tax_registration_number)}</div>` : ''}
    </div>
    <div>
      <div class="section-title">Bill To</div>
      <div>${escapeHtml(client?.display_name ?? document.client_name_snapshot ?? '—')}</div>
      ${client?.address ? `<div>${escapeHtml(client.address)}</div>` : ''}
      ${client?.email ? `<div>${escapeHtml(client.email)}</div>` : ''}
      ${client?.phone ? `<div>${escapeHtml(client.phone)}</div>` : ''}
    </div>
    <div>
      <div class="section-title">Details</div>
      <div>Issued: ${formatDate(document.issue_date)}</div>
      ${document.doc_type === 'invoice' ? `<div>Due: ${formatDate(document.due_date)}</div>` : `<div>Valid until: ${formatDate(document.expiry_date)}</div>`}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Tax</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${formatMinor(document.subtotal_minor, document.currency_code)}</span></div>
    ${document.discount_amount_minor > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatMinor(document.discount_amount_minor, document.currency_code)}</span></div>` : ''}
    <div class="totals-row"><span>Tax</span><span>${formatMinor(document.tax_total_minor, document.currency_code)}</span></div>
    <div class="totals-row total"><span>Total</span><span>${formatMinor(document.total_minor, document.currency_code)}</span></div>
    ${document.amount_paid_minor > 0 ? `<div class="totals-row"><span>Paid</span><span>${formatMinor(document.amount_paid_minor, document.currency_code)}</span></div>
    <div class="totals-row"><span>Balance Due</span><span>${formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code)}</span></div>` : ''}
  </div>

  ${merchantSig || clientSig ? `
  <div class="signatures">
    <div class="signature-block">
      ${merchantSig && signatureImagesBase64[merchantSig.id] ? `<img src="data:image/png;base64,${signatureImagesBase64[merchantSig.id]}" />` : ''}
      <div class="signature-line">Merchant${merchantSig ? ` — signed ${formatDate(merchantSig.signed_at)}` : ' — not yet signed'}</div>
    </div>
    <div class="signature-block">
      ${clientSig && signatureImagesBase64[clientSig.id] ? `<img src="data:image/png;base64,${signatureImagesBase64[clientSig.id]}" />` : ''}
      <div class="signature-line">Client${clientSig ? ` — signed ${formatDate(clientSig.signed_at)}` : ' — not yet signed'}</div>
    </div>
  </div>` : ''}

  ${document.notes ? `<div class="footer"><strong>Notes</strong>\n${escapeHtml(document.notes)}</div>` : ''}
  ${profile.payment_instructions ? `<div class="footer"><strong>Payment Instructions</strong>\n${escapeHtml(profile.payment_instructions)}</div>` : ''}
  <div class="footer">${escapeHtml(document.terms_override || profile.footer_terms || '')}</div>
</body>
</html>`;
}
