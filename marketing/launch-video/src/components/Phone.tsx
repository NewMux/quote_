import React from 'react';
import { C, FONT } from '../theme';

export const SCREEN_W = 393;
export const SCREEN_H = 852;

/** An iPhone drawn in CSS. Children are laid out in iOS points (393×852) and scaled to fit, so
 * the mockups can use the app's real point sizes (17pt body, 34pt large titles…). */
export const Phone: React.FC<{
  width?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
  glow?: number;
}> = ({ width = 720, style, children, glow = 1 }) => {
  const edge = width * 0.006;
  const bezel = width * 0.03;
  const screenW = width - 2 * (edge + bezel);
  const scale = screenW / SCREEN_W;
  const screenH = SCREEN_H * scale;
  const height = screenH + 2 * (edge + bezel);
  const outerRadius = width * 0.17;

  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        borderRadius: outerRadius,
        padding: edge,
        background: 'linear-gradient(145deg, #8A8A90 0%, #2A2A2E 18%, #1A1A1D 50%, #3A3A3F 82%, #9A9AA0 100%)',
        boxShadow: `0 60px 120px rgba(0,0,0,0.65), 0 0 ${160 * glow}px rgba(76,211,165,${0.22 * glow})`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: outerRadius - edge,
          background: '#050505',
          padding: bezel,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: screenW,
            height: screenH,
            borderRadius: outerRadius - edge - bezel,
            overflow: 'hidden',
            background: C.bg,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: SCREEN_W,
              height: SCREEN_H,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              fontFamily: FONT,
              color: C.label,
            }}
          >
            {children}
            <StatusBar />
            <div
              style={{
                position: 'absolute',
                left: (SCREEN_W - 124) / 2,
                top: 11,
                width: 124,
                height: 36,
                borderRadius: 18,
                background: '#000',
              }}
            />
          </div>
          {/* Glass glare across the display. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 32%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const phoneHeight = (width: number) => {
  const edge = width * 0.006;
  const bezel = width * 0.03;
  const screenW = width - 2 * (edge + bezel);
  return (SCREEN_H * screenW) / SCREEN_W + 2 * (edge + bezel);
};

const StatusBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: SCREEN_W,
      height: 54,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 34px 0 48px',
      fontSize: 17,
      fontWeight: 600,
      zIndex: 5,
    }}
  >
    <span>9:41</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.8} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill="#fff" />
        ))}
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1.5 4.5a10 10 0 0 1 14 0M4 7.2a6.4 6.4 0 0 1 9 0" />
        <circle cx="8.5" cy="10" r="1.2" fill="#fff" stroke="none" />
      </svg>
      <svg width="27" height="13" viewBox="0 0 27 13">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="rgba(255,255,255,0.45)" />
        <rect x="2.5" y="2.5" width="19" height="8" rx="2.2" fill="#fff" />
        <rect x="24.8" y="4.3" width="1.8" height="4.4" rx="0.9" fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  </div>
);
