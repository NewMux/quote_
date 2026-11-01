import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND, BRAND_FONT } from '../brand';
import { Phone } from '../components/Phone';
import { BRAND_FONT_AR, dirFor, fontFor, tracking, useLang, useT } from './lang';

// App Store screenshots: iPhone 6.9" (1320×2868), the size App Store Connect asks for first. It
// scales down to every smaller iPhone size, and the app is iPhone-only (supportsTablet: false).
export const STORE_W = 1320;
export const STORE_H = 2868;
export const MARGIN = 96;

/** Flat fields from the Invoice Them identity (src/brand.ts): no gradients, no glows. */
export const PAL = {
  midnight: BRAND.midnight,
  paper: BRAND.paper,
  lime: BRAND.lime,
  violet: BRAND.violet,
  white: '#FFFFFF',
} as const;

export const Canvas: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => {
  const lang = useLang();
  return <AbsoluteFill style={{ background: bg, overflow: 'hidden', fontFamily: fontFor(lang) }}>{children}</AbsoluteFill>;
};

/** Headline + sub-line, pinned to the top or the bottom of the canvas. `*word*` gets a lime marker stripe under it. */
export const TextBlock: React.FC<{
  lines: string[];
  sub: string;
  color: string;
  subColor?: string;
  top?: number;
  bottom?: number;
  size?: number;
}> = ({ lines, sub, color, subColor, top, bottom, size = 160 }) => {
  const lang = useLang();
  const t = useT();
  const ar = lang === 'ar';
  return (
  <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top, bottom, color, direction: dirFor(lang) }}>
    <div style={{ fontFamily: ar ? BRAND_FONT_AR : BRAND_FONT, fontSize: ar ? size * 0.92 : size, fontWeight: ar ? 700 : 800, letterSpacing: tracking(lang, '-0.045em'), lineHeight: ar ? 1.2 : 0.98, whiteSpace: 'nowrap' }}>
      {lines.map((line) => (
        <div key={line}>
          {t(line)
            .split(/(\*[^*]+\*)/g)
            .filter(Boolean)
            .map((part, i) =>
              part.startsWith('*') ? (
                <span key={i} style={{ backgroundImage: `linear-gradient(transparent 66%, ${PAL.lime} 66%, ${PAL.lime} 92%, transparent 92%)`, padding: '0 0.04em', margin: '0 -0.04em' }}>
                  {part.slice(1, -1)}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </div>
      ))}
    </div>
    <div style={{ marginTop: 40, maxWidth: 1010, fontSize: 48, lineHeight: ar ? 1.45 : 1.26, fontWeight: 500, letterSpacing: tracking(lang, '-0.012em'), color: subColor ?? color, opacity: subColor ? 1 : 0.74 }}>{t(sub)}</div>
  </div>
  );
};

/** An iPhone, with a shadow that suits the field it sits on. */
export const Device: React.FC<{ left: number; top: number; width: number; shadow?: string; children: React.ReactNode }> = ({
  left,
  top,
  width,
  shadow = '0 70px 120px rgba(0,0,0,0.32)',
  children,
}) => (
  <Phone width={width} lightScreen shadow={shadow} style={{ left, top }}>
    {children}
  </Phone>
);

/** An app screen with no device around it, zoomed in. `offsetY` (pt) scrolls the screen up so the
 * status-bar gap doesn't show. */
export const ScreenPanel: React.FC<{ left: number; top: number; width: number; height: number; offsetY?: number; radius?: number; shadow?: string; children: React.ReactNode }> = ({
  left,
  top,
  width,
  height,
  offsetY = 0,
  radius = 84,
  shadow = '0 50px 100px rgba(18,17,43,0.22)',
  children,
}) => {
  const s = width / 393;
  return (
    <div style={{ position: 'absolute', left, top, width, height, borderRadius: radius, overflow: 'hidden', boxShadow: shadow, background: '#F2F2F7' }}>
      <div style={{ position: 'absolute', left: 0, top: -offsetY * s, width: 393, height: 852, transform: `scale(${s})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
};
