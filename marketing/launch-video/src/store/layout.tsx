import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { NightCanvas } from '../v2/kit';

// App Store screenshots: iPhone 6.9" (1320×2868), the largest size App Store Connect asks for. It
// scales down to every smaller iPhone size, and the app is iPhone-only (supportsTablet: false).
export const STORE_W = 1320;
export const STORE_H = 2868;
export const MARGIN = 90;

export type StoreTheme = {
  from: string;
  to: string;
  /** The headline's emphasized words (a pale tint of the background). */
  accent: string;
};

export const THEMES = {
  blue: { from: '#5A8DFF', to: '#1F4FE0', accent: '#CFE0FF' },
  orange: { from: '#FFA15E', to: '#F0590B', accent: '#FFE6CC' },
  violet: { from: '#A28FFF', to: '#5A3DE6', accent: '#E3DCFF' },
  pink: { from: '#FF7BAB', to: '#DC2A6E', accent: '#FFDBE8' },
  green: { from: '#2FCB7C', to: '#0C7F50', accent: '#D2F8E2' },
  night: { from: '#0B0D17', to: '#0B0D17', accent: '#B5A6FF' },
} as const satisfies Record<string, StoreTheme>;

/** One screenshot: a colored backdrop, a headline and sub-line at the top, and the phone / cards
 * as children. `*word*` in a headline line takes the theme's accent tint. */
export const StoreFrame: React.FC<{ theme: StoreTheme; lines: string[]; sub: string; night?: boolean; children: React.ReactNode }> = ({
  theme,
  lines,
  sub,
  night,
  children,
}) => (
  <AbsoluteFill style={{ overflow: 'hidden', fontFamily: FONT, background: night ? undefined : `linear-gradient(165deg, ${theme.from} 0%, ${theme.to} 100%)` }}>
    {night ? (
      <NightCanvas />
    ) : (
      <>
        <div
          style={{
            position: 'absolute',
            width: 1700,
            height: 1700,
            right: -700,
            top: -820,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.30) 0%, transparent 62%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 1800,
            height: 1800,
            left: -900,
            bottom: -1000,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(10,14,60,0.30) 0%, transparent 64%)',
          }}
        />
      </>
    )}
    <div style={{ position: 'absolute', top: 170, left: MARGIN, right: MARGIN, color: '#FFFFFF' }}>
      <div style={{ fontSize: 124, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.04, whiteSpace: 'nowrap' }}>
        {lines.map((line) => (
          <div key={line}>
            {line
              .split(/(\*[^*]+\*)/g)
              .filter(Boolean)
              .map((part, i) =>
                part.startsWith('*') ? (
                  <span key={i} style={{ color: theme.accent }}>
                    {part.slice(1, -1)}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 34, fontSize: 52, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.22, color: 'rgba(255,255,255,0.82)', maxWidth: 1050 }}>{sub}</div>
    </div>
    {children}
  </AbsoluteFill>
);

/** The phone, centered and bleeding off the bottom edge like the rest of the set. */
export const StorePhone: React.FC<{ top: number; width?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  top,
  width = 1120,
  style,
  children,
}) => (
  <Phone
    width={width}
    lightScreen
    shadow="0 90px 150px rgba(8,10,50,0.40), 0 24px 50px rgba(8,10,50,0.22)"
    style={{ left: (STORE_W - width) / 2, top, ...style }}
  >
    {children}
  </Phone>
);
