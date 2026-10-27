import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND_FONT, TAGLINE } from '../brand';
import { AppMark } from '../components/Bits';
import { FONT } from '../theme';
import { DetailScreen, SignSheet, SummaryScreen } from './app/screens';
import { PAL, ScreenPanel } from './design';
import { PdfPage } from './pdf';

// A TikTok photo carousel: 1080×1440 (3:4), one idea per slide, the same look throughout (a cover on
// midnight, then paper slides with the app zoomed in). Text stays in the top 55% of each slide,
// away from TikTok's caption and button overlays. Follows the playbook in tiktok-studio's
// references/viral-playbook.md.
export const SLIDE_W = 1080;
export const SLIDE_H = 1440;
const TOTAL = 7;

const marked = (line: string, color: string) =>
  line
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('*') ? (
        <span key={i} style={{ backgroundImage: `linear-gradient(transparent 66%, ${PAL.lime} 66%, ${PAL.lime} 92%, transparent 92%)`, padding: '0 0.04em', margin: '0 -0.04em', color }}>
          {part.slice(1, -1)}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );

const Counter: React.FC<{ n: number; dark?: boolean }> = ({ n, dark }) => (
  <div style={{ position: 'absolute', left: 80, top: 64, fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: '0.04em', color: dark ? '#fff' : PAL.midnight, opacity: 0.5 }}>
    {String(n).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
  </div>
);

const Body: React.FC<{ eyebrow: string; lines: string[]; body: string; n: number; children?: React.ReactNode }> = ({ eyebrow, lines, body, n, children }) => (
  <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT, color: PAL.midnight, overflow: 'hidden' }}>
    <Counter n={n} />
    <div style={{ position: 'absolute', right: 80, top: 52 }}>
      <AppMark size={64} />
    </div>
    <div style={{ position: 'absolute', left: 80, right: 80, top: 170 }}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.5 }}>{eyebrow}</div>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 118, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.98, marginTop: 22, whiteSpace: 'nowrap' }}>
        {lines.map((l) => (
          <div key={l}>{marked(l, PAL.midnight)}</div>
        ))}
      </div>
      <div style={{ marginTop: 34, fontSize: 44, lineHeight: 1.26, fontWeight: 500, letterSpacing: '-0.012em', opacity: 0.74, maxWidth: 880 }}>{body}</div>
    </div>
    {children}
  </AbsoluteFill>
);

const PANEL = { left: 130, top: 740, width: 820, height: 760 } as const;

/** Slide 1 (A) and the alternative cover (B): the hook, as big as it goes. */
const Cover: React.FC<{ lines: string[]; sub: string; size?: number }> = ({ lines, sub, size = 150 }) => (
  <AbsoluteFill style={{ background: PAL.midnight, fontFamily: FONT, color: '#fff' }}>
    <Counter n={1} dark />
    <div style={{ position: 'absolute', right: 80, top: 52 }}>
      <AppMark size={64} />
    </div>
    <div style={{ position: 'absolute', left: 80, right: 80, top: 250 }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: size, fontWeight: 800, letterSpacing: '-0.048em', lineHeight: 0.98, whiteSpace: 'nowrap' }}>
        {lines.map((l) => (
          <div key={l}>{marked(l, '#fff')}</div>
        ))}
      </div>
      <div style={{ marginTop: 52, fontSize: 52, lineHeight: 1.25, fontWeight: 500, color: PAL.lime }}>{sub}</div>
    </div>
    <div style={{ position: 'absolute', left: 80, bottom: 150, fontSize: 34, fontWeight: 600, opacity: 0.55 }}>Swipe →</div>
  </AbsoluteFill>
);

export const CoverA: React.FC = () => <Cover lines={['5 ways to get', 'your invoice', '*paid faster*']} sub="Number 1 takes seconds." />;
export const CoverB: React.FC = () => <Cover lines={['If you send', 'invoices from', '*spreadsheets*,', 'read this']} sub="There’s a faster way." size={136} />;

const Crop: React.FC<{ x: number; y: number; s: number; children: React.ReactNode }> = ({ x, y, s, children }) => (
  <div style={{ position: 'absolute', left: PANEL.left, top: PANEL.top, width: PANEL.width, height: PANEL.height, borderRadius: 60, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(18,17,43,0.2), 0 0 0 1px rgba(18,17,43,0.05)' }}>
    <div style={{ position: 'absolute', left: -x * s, top: -y * s, transform: `scale(${s})`, transformOrigin: '0 0' }}>{children}</div>
  </div>
);

export const Way1: React.FC = () => (
  <Body n={2} eyebrow="Way 1 of 5" lines={['Put a *pay link*', 'on it']} body="A QR code and a Pay button on every PDF. Clients pay from their phone.">
    <Crop x={4} y={470} s={1.32}>
      <PdfPage height={1000} />
    </Crop>
  </Body>
);

export const Way2: React.FC = () => (
  <Body n={3} eyebrow="Way 2 of 5" lines={['Get it *signed*', 'on the spot']} body="Your client signs on your phone. No “I’ll look at it later.”">
    <ScreenPanel {...PANEL} offsetY={0} radius={60}>
      <SignSheet signatureTop={80} />
    </ScreenPanel>
  </Body>
);

export const Way3: React.FC = () => (
  <Body n={4} eyebrow="Way 3 of 5" lines={['Send it the', '*same day*']} body="Make it in seconds and share the PDF before you leave the job.">
    <ScreenPanel {...PANEL} offsetY={232} radius={60}>
      <DetailScreen />
    </ScreenPanel>
  </Body>
);

export const Way4: React.FC = () => (
  <Body n={5} eyebrow="Way 4 of 5" lines={['Know who’s', '*overdue*']} body="Every overdue invoice in one list, oldest first.">
    <ScreenPanel {...PANEL} offsetY={428} radius={60}>
      <SummaryScreen />
    </ScreenPanel>
  </Body>
);

export const Way5: React.FC = () => (
  <Body n={6} eyebrow="Way 5 of 5" lines={['Remind in', '*one tap*']} body="On an overdue invoice, the big button becomes Send Reminder.">
    <ScreenPanel {...PANEL} offsetY={232} radius={60}>
      <DetailScreen variant="overdue" />
    </ScreenPanel>
  </Body>
);

export const End: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT, color: PAL.midnight }}>
    <Counter n={7} />
    <div style={{ position: 'absolute', left: 80, right: 80, top: 250 }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 130, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.98 }}>
        <div>{marked('*Send this*', PAL.midnight)}</div>
        <div>to a friend</div>
        <div>who invoices</div>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 80, bottom: 330, display: 'flex', alignItems: 'center', gap: 34 }}>
      <AppMark size={170} />
      <div>
        <div style={{ fontFamily: BRAND_FONT, fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>Invoice Them</div>
        <div style={{ fontSize: 38, fontWeight: 600, opacity: 0.62, marginTop: 10 }}>{TAGLINE}</div>
        <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.5, marginTop: 6 }}>On the App Store</div>
      </div>
    </div>
  </AbsoluteFill>
);

export const SLIDES = [
  { id: 'TikA1', file: 'A-01-cover', Component: CoverA },
  { id: 'TikA2', file: 'A-02-pay-link', Component: Way1 },
  { id: 'TikA3', file: 'A-03-signed', Component: Way2 },
  { id: 'TikA4', file: 'A-04-same-day', Component: Way3 },
  { id: 'TikA5', file: 'A-05-overdue', Component: Way4 },
  { id: 'TikA6', file: 'A-06-reminder', Component: Way5 },
  { id: 'TikA7', file: 'A-07-send-this', Component: End },
  { id: 'TikBCover', file: 'B-01-cover', Component: CoverB },
] as const;
