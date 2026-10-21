import React, { useLayoutEffect, useRef } from 'react';
import { INVOICE_HTML } from './generated/invoiceHtml';

// The invoice PDF as the app makes it: the HTML comes straight out of src/lib/pdf/htmlTemplate.ts
// (see scripts/make-real-pdf.mjs). It's rendered inside a shadow root so the template's own
// `body` / `*` rules stay out of the rest of the page, at expo-print's 612 pt page width.
const html = INVOICE_HTML.replace(/body \{/, ':host {').replace(/-apple-system, Helvetica, Arial, sans-serif/, 'Inter, -apple-system, Helvetica, Arial, sans-serif');
const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';

export const PDF_W = 612;

export const PdfPage: React.FC<{ height?: number; style?: React.CSSProperties }> = ({ height = 792, style: outer }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>:host{display:block;width:${PDF_W}px;height:${height}px;background:#fff;overflow:hidden;color:#1f2937}${style}</style>${body}`;
  }, [height]);
  return <div ref={ref} style={{ width: PDF_W, height, background: '#fff', ...outer }} />;
};
