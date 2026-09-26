import { format, parseISO } from 'date-fns';
import { getTaxLabel } from '../documentCalculations';
import { formatMinor, formatRateBp } from '../money';
import { resolvePaymentLink } from '../paymentLink';
import { qrSvg } from './qrSvg';
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
  const businessName = profile.business_name || 'Your Business';
  const clientName = client?.display_name ?? document.client_name_snapshot ?? 'Client';

  const balanceMinor = document.total_minor - document.amount_paid_minor;
  const payLink =
    document.doc_type === 'invoice' && document.status !== 'void' && balanceMinor > 0
      ? resolvePaymentLink(document.payment_link || profile.payment_link, {
          amountMinor: balanceMinor,
          currencyCode: document.currency_code,
          docNumber: document.doc_number,
        })
      : null;

  const signatureBlock = (sig: SignatureRecord | undefined, name: string, role: string) => `
    <div class="signature-block">
      <div class="signature-ink">${sig && signatureImagesBase64[sig.id] ? `<img src="data:image/png;base64,${signatureImagesBase64[sig.id]}" />` : ''}</div>
      <div class="signature-line"><strong>${escapeHtml(name)}</strong>${sig ? ` · Signed ${formatDate(sig.signed_at)}` : ` · ${role} signature`}</div>
    </div>`;

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
  .signatures { display: flex; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
  .signature-block { flex: 1; }
  .signature-ink { height: 110px; display: flex; align-items: flex-end; }
  .signature-ink img { height: 110px; max-width: 100%; object-fit: contain; object-position: left bottom; }
  .signature-line { border-top: 1px solid #9ca3af; margin-top: 6px; padding-top: 6px; font-size: 12px; color: #6b7280; }
  .signature-line strong { color: #111827; font-weight: 600; }
  .pay { display: flex; align-items: center; gap: 20px; margin-top: 28px; padding: 18px; border: 1.5px solid ${accent}; border-radius: 14px; page-break-inside: avoid; }
  .pay-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
  .pay-text { font-size: 12px; color: #6b7280; margin: 0 0 10px; }
  .pay-button { display: inline-block; background: ${accent}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 999px; }
  .pay-url { font-size: 10px; color: #6b7280; margin-top: 8px; word-break: break-all; }
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
    <div class="totals-row"><span>${escapeHtml(getTaxLabel(lines.map((l) => ({ isTaxable: l.is_taxable === 1, taxName: l.tax_bracket_name_snapshot }))))}</span><span>${formatMinor(document.tax_total_minor, document.currency_code)}</span></div>
    <div class="totals-row total"><span>Total</span><span>${formatMinor(document.total_minor, document.currency_code)}</span></div>
    ${document.amount_paid_minor > 0 ? `<div class="totals-row"><span>Paid</span><span>${formatMinor(document.amount_paid_minor, document.currency_code)}</span></div>
    <div class="totals-row"><span>Balance Due</span><span>${formatMinor(document.total_minor - document.amount_paid_minor, document.currency_code)}</span></div>` : ''}
  </div>

  ${payLink ? `
  <div class="pay">
    ${qrSvg(payLink, 112)}
    <div>
      <p class="pay-title">Pay online</p>
      <p class="pay-text">Scan the code with your phone's camera, or tap the button.</p>
      <a class="pay-button" href="${escapeHtml(payLink)}">Pay ${formatMinor(balanceMinor, document.currency_code)}</a>
      <div class="pay-url">${escapeHtml(payLink)}</div>
    </div>
  </div>` : ''}

  ${merchantSig || clientSig ? `
  <div class="signatures">
    ${signatureBlock(merchantSig, businessName, 'Authorized')}
    ${signatureBlock(clientSig, clientName, 'Client')}
  </div>` : ''}

  ${document.notes ? `<div class="footer"><strong>Notes</strong>\n${escapeHtml(document.notes)}</div>` : ''}
  ${profile.payment_instructions ? `<div class="footer"><strong>Payment Instructions</strong>\n${escapeHtml(profile.payment_instructions)}</div>` : ''}
  <div class="footer">${escapeHtml(document.terms_override || profile.footer_terms || '')}</div>
</body>
</html>`;
}
