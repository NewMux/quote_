import React, { useLayoutEffect, useRef } from 'react';
import { INVOICE_HTML, INVOICE_HTML_AR } from './generated/invoiceHtml';
import { useLang } from './lang';

// The invoice PDF as the app makes it: the HTML comes straight out of src/lib/pdf/htmlTemplate.ts
// (see scripts/make-real-pdf.mjs), in English or Arabic. It's rendered inside a shadow root so the
// template's own `body` / `*` rules stay out of the rest of the page, at expo-print's 612 pt page
// width.
const parts = (source: string, font: string) => {
  const html = source.replace(/body \{/, ':host {').replace(/-apple-system, Helvetica, Arial, sans-serif/, font);
  return { style: html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '', body: html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '' };
};
const EN = parts(INVOICE_HTML, 'Inter, -apple-system, Helvetica, Arial, sans-serif');
const AR = parts(INVOICE_HTML_AR, '"IBM Plex Sans Arabic", Inter, -apple-system, Helvetica, Arial, sans-serif');

export const PDF_W = 612;

export const PdfPage: React.FC<{ height?: number; style?: React.CSSProperties }> = ({ height = 792, style: outer }) => {
  const lang = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    const { style, body } = lang === 'ar' ? AR : EN;
    root.innerHTML = `<style>:host{display:block;width:${PDF_W}px;height:${height}px;background:#fff;overflow:hidden;color:#1f2937;direction:${lang === 'ar' ? 'rtl' : 'ltr'}}${style}</style>${body}`;
  }, [height, lang]);
  return <div ref={ref} style={{ width: PDF_W, height, background: '#fff', ...outer }} />;
};
