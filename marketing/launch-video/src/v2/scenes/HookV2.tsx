import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { EASE_IN } from '../../anim';
import { FONT } from '../../theme';
import { Canvas, LineReveal } from '../kit';
import { ACCENT, L } from '../theme';

const COLS = 5;
const ROWS = 13;
const VALUES = ['=SUM(B2:B9', '1,250.00', '#REF!', 'INV-0038?', '450', 'Total', '=B4*1.1', 'Due ??', '3,900', '#VALUE!', 'Client', '12/09', 'Paid?'];

/** 0–4.8 s: a jittery, error-riddled spreadsheet under the question — then it falls apart. */
export const HookV2: React.FC = () => {
  const frame = useCurrentFrame();
  const tick = Math.floor(frame / 6);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.red} />
      <div
        style={{
          position: 'absolute',
          left: 540 - (COLS * 190) / 2,
          top: 700,
          width: COLS * 190,
          transform: 'perspective(2200px) rotateX(24deg) rotateZ(-5deg)',
          transformOrigin: '50% 0%',
          fontFamily: FONT,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const dist = Math.hypot(c - 2, r - 5);
          const fall = interpolate(frame, [92 + dist * 3, 136 + dist * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN });
          const jitter = frame < 92 ? 3 : 0;
          const text = VALUES[(i * 7 + r) % VALUES.length];
          const isError = text.startsWith('#') || text.endsWith('?');
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c * 190 + (random(`x${i}${tick}`) - 0.5) * jitter * 2,
                top: r * 66 + (random(`y${i}${tick}`) - 0.5) * jitter * 2,
                width: 184,
                height: 60,
                borderRadius: 8,
                background: isError ? '#FFF1F0' : '#FFFFFF',
                border: `1.5px solid ${isError ? '#FFB3AD' : L.separator}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: 24,
                fontWeight: 500,
                color: isError ? ACCENT.red : L.secondary,
                translate: `${(c - 2) * fall * 220}px ${fall * (900 + random(`f${i}`) * 500)}px`,
                rotate: `${(random(`r${i}`) - 0.5) * fall * 120}deg`,
                opacity: 1 - fall,
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 250, left: 70, right: 70 }}>
        <LineReveal lines={['Still invoicing', 'in *spreadsheets?*']} accent={ACCENT.red} at={8} stagger={10} size={110} outAt={128} />
      </div>
    </AbsoluteFill>
  );
};
