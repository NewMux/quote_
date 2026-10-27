import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AppMark } from '../components/Bits';
import { SCREEN_H, SCREEN_W } from '../components/Phone';
import { FONT } from '../theme';
import { CREATE_ADDS } from '../v2/scenes/CreateV2';
import { EditorLight } from '../v2/screens';
import { DetailScreen, DocumentsScreen, SignScreen, SummaryScreen } from './app/screens';
import { PAL } from './design';
import { PdfPage } from './pdf';

// UGC-style TikTok photo slides: each one is a full-screen capture of a phone, the way a person
// would screenshot or screen-record an app, with TikTok-native text on top (bold white, black
// outline, casual lower-case). 1080×1920 (9:16). The copy is "POV" framing, not testimonials.
export const UGC_W = 1080;
export const UGC_H = 1920;
const K = UGC_W / SCREEN_W; // points → pixels

/** An iPhone screenshot: the status bar and island over the content, no tab bar (cropped). */
const Shot: React.FC<{ bg?: string; dark?: boolean; children: React.ReactNode }> = ({ bg = '#F2F2F7', dark, children }) => {
  const ink = dark ? '#fff' : '#111';
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, transform: `scale(${K})`, transformOrigin: '0 0' }}>{children}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: UGC_W, height: 150, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '34px 100px 0 120px', fontSize: 46, fontWeight: 600, color: ink, zIndex: 20 }}>
        <span>9:41</span>
        <svg width="190" height="48" viewBox="0 0 70 18" style={{ marginTop: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 5} y={13 - i * 4} width="3.4" height={4 + i * 4} rx="1" fill={ink} />
          ))}
          <path d="M26 6a9 9 0 0 1 12 0M28.6 9a5.5 5.5 0 0 1 6.8 0" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="32" cy="12.4" r="1.3" fill={ink} />
          <rect x="45" y="3" width="21" height="11" rx="3.4" fill="none" stroke={ink} strokeOpacity="0.45" />
          <rect x="46.8" y="4.8" width="15" height="7.4" rx="2" fill={ink} />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: (UGC_W - 340) / 2, top: 30, width: 340, height: 100, borderRadius: 50, background: '#000', zIndex: 21 }} />
    </AbsoluteFill>
  );
};

/** An outline built from shadows, so the letters keep their shape (a thick -webkit-text-stroke eats into them). */
const OUTLINE = (() => {
  const out: string[] = [];
  for (const r of [7, 4]) for (let a = 0; a < 360; a += 20) out.push(`${(r * Math.cos((a * Math.PI) / 180)).toFixed(1)}px ${(r * Math.sin((a * Math.PI) / 180)).toFixed(1)}px 0 #000`);
  return out.join(', ');
})();

/** TikTok's own text look: bold white with a black outline, centered, in the upper third. */
const Native: React.FC<{ lines: string[]; top?: number; size?: number; color?: string }> = ({ lines, top = 330, size: maxSize = 84, color = '#fff' }) => {
  // Shrinks until the longest line fits inside the screen with room for the outline.
  const size = Math.min(maxSize, Math.floor(920 / (Math.max(...lines.map((l) => l.length)) * 0.56)));
  return (
  <div
    style={{
      position: 'absolute',
      left: 40,
      right: 40,
      top,
      textAlign: 'center',
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.16,
      letterSpacing: '0em',
      wordSpacing: '0.14em',
      whiteSpace: 'nowrap',
      color,
      textShadow: OUTLINE,
      zIndex: 30,
    }}
  >
    {lines.map((l) => (
      <div key={l}>{l}</div>
    ))}
  </div>
  );
};

// The "before": a generic spreadsheet, the way a lot of people still invoice.
const Spreadsheet: React.FC = () => {
  const cols = ['A', 'B', 'C', 'D', 'E'];
  const rows: string[][] = [
    ['Client', 'Invoice #', 'Amount', 'Paid?', 'Notes'],
    ['Harbor Coffee', '41', '4290', 'no?', 'call lina'],
    ['Juniper Bakery', '40', '780', 'yes', ''],
    ['Lumen Fit', '39', '1000', 'no??', 'follow up!!'],
    ['Orchard Pine', '38', '950', '???', 'check bank'],
    ['Brightside', '36', '1200', 'no', 'send reminder'],
    ...Array.from({ length: 12 }, () => ['', '', '', '', '']),
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H, background: '#fff', color: '#111', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>invoices_FINAL_v3_real.xlsx</div>
      <div style={{ position: 'absolute', top: 116, left: 0, right: 0 }}>
        <div style={{ display: 'flex', background: '#F1F3F4', borderBottom: '1px solid #DADCE0', height: 30 }}>
          <div style={{ width: 30, borderRight: '1px solid #DADCE0' }} />
          {cols.map((c) => (
            <div key={c} style={{ flex: 1, textAlign: 'center', fontSize: 13, lineHeight: '30px', color: '#5F6368', borderRight: '1px solid #DADCE0' }}>
              {c}
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', height: 44, borderBottom: '1px solid #E0E0E0' }}>
            <div style={{ width: 30, background: '#F1F3F4', borderRight: '1px solid #DADCE0', textAlign: 'center', fontSize: 12, lineHeight: '44px', color: '#5F6368' }}>{i + 1}</div>
            {r.map((c, j) => (
              <div key={j} style={{ flex: 1, padding: '0 6px', fontSize: 13, lineHeight: '44px', whiteSpace: 'nowrap', overflow: 'hidden', borderRight: '1px solid #E0E0E0', fontWeight: i === 0 ? 700 : 400, color: j === 3 && /no|\?/.test(c) && i > 0 ? '#D93025' : '#111' }}>
                {c}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const U1: React.FC = () => (
  <Shot bg="#fff">
    <Spreadsheet />
  </Shot>
);
export const U1B: React.FC = () => (
  <Shot bg="#F2F2F7">
    <DocumentsScreen />
  </Shot>
);
export const U2: React.FC = () => (
  <Shot>
    <EditorLight f={150} adds={CREATE_ADDS} />
  </Shot>
);
export const U3: React.FC = () => (
  <Shot bg="#6B6B70" dark>
    <SignScreen />
  </Shot>
);
export const U4: React.FC = () => (
  <Shot bg="#E5E5EA">
    <div style={{ position: 'absolute', left: 0, top: 80, width: 612, height: 1100, transform: `scale(${SCREEN_W / 612})`, transformOrigin: '0 0' }}>
      <PdfPage height={1100} />
    </div>
  </Shot>
);
export const U5: React.FC = () => (
  <Shot>
    <SummaryScreen />
  </Shot>
);
export const U6: React.FC = () => (
  <Shot>
    <DetailScreen variant="overdue" />
  </Shot>
);
export const U7: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT, alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ marginTop: 330, filter: 'drop-shadow(0 40px 60px rgba(18,17,43,0.25))' }}>
      <AppMark size={430} />
    </div>
  </AbsoluteFill>
);

const withText = (Base: React.FC, lines: string[], top?: number): React.FC => {
  const C: React.FC = () => (
    <>
      <Base />
      <Native lines={lines} top={top} />
    </>
  );
  return C;
};

export const UGC_SLIDES = [
  { id: 'UgcA1', file: '01-cover', Component: withText(U1, ['pov: you still invoice', 'from a spreadsheet']) },
  { id: 'UgcA2', file: '02-create', Component: withText(U2, ['then you find an app that', 'makes invoices in seconds'], 430) },
  { id: 'UgcA3', file: '03-sign', Component: withText(U3, ['your client signs it', 'right on your phone'], 420) },
  { id: 'UgcA4', file: '04-pay', Component: withText(U4, ['and the pdf has a qr code', 'so they just pay'], 310) },
  { id: 'UgcA5', file: '05-overdue', Component: withText(U5, ['it shows you', 'who is overdue'], 330) },
  { id: 'UgcA6', file: '06-reminder', Component: withText(U6, ['one tap and the', 'reminder is sent'], 330) },
  { id: 'UgcA7', file: '07-name', Component: withText(U7, ['it’s called', 'Invoice Them', 'it’s on the App Store'], 300) },
  { id: 'UgcBCover', file: 'B-cover', Component: withText(U1B, ['freelancers, you', 'need to see this'], 330) },
] as const;
