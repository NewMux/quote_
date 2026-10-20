import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT } from '../anim';
import { FONT } from '../theme';
import { PdfV2 } from '../v2/screens';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Graphics fill the 1080×720 band and keep their content in the left ~520 px: the subtitle
// column takes the right side while they're on screen (see cardSide in timing.ts).

/** "The average": the invoice is a text message. */
export const TextInvoice: React.FC = () => {
  const f = useCurrentFrame();
  const bubbles = ['hey its 450 for the job', '+120 materials i think?', 'venmo or cash whatever works'];
  const shake = Math.sin(f * 1.7) * 2;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 30% 45%, #2A2C33 0%, #0C0D10 70%)' }}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 150 + shake,
          width: 440,
          height: 470,
          borderRadius: 48,
          background: '#000',
          border: '6px solid #26272B',
          padding: '36px 26px',
          fontFamily: FONT,
          rotate: '-3deg',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', color: '#9A9AA0', fontSize: 20, marginBottom: 6 }}>Mike (client)</div>
        <div style={{ textAlign: 'center', color: '#5A5A60', fontSize: 15, marginBottom: 26 }}>Today 11:48 PM</div>
        {bubbles.map((b, i) => {
          const at = i * 9;
          const p = interpolate(f, [at, at + 6], [0, 1], { ...CLAMP, easing: EASE_OUT });
          return (
            <div key={b} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, opacity: p, translate: `0px ${(1 - p) * 20}px` }}>
              <div style={{ maxWidth: 300, padding: '14px 20px', borderRadius: 26, background: '#2E7CF6', color: '#fff', fontSize: 25, lineHeight: 1.25 }}>{b}</div>
            </div>
          );
        })}
        <div style={{ textAlign: 'right', color: '#5A5A60', fontSize: 15, opacity: interpolate(f, [26, 30], [0, 1], CLAMP) }}>Delivered</div>
      </div>
    </AbsoluteFill>
  );
};

/** "…an afterthought": a crooked, typo'd document under a harsh phone flash. */
export const SloppyInvoice: React.FC = () => {
  const f = useCurrentFrame();
  const serif = '"Times New Roman", "Liberation Serif", "DejaVu Serif", serif';
  const line = (l: string, r: string, extra?: React.CSSProperties) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #999', padding: '6px 0', ...extra }}>
      <span>{l}</span>
      <span>{r}</span>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: '#1B1712' }}>
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 30,
          width: 480,
          height: 640,
          background: '#EDE6D3',
          padding: '40px 36px',
          fontFamily: serif,
          color: '#2B2B2B',
          fontSize: 22,
          rotate: `${-7 + f * 0.04}deg`,
          translate: `${f * 0.4}px 0px`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          filter: 'blur(0.6px)',
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 700, textDecoration: 'underline', marginBottom: 18 }}>INVOCE</div>
        <div>To: mike</div>
        <div style={{ marginBottom: 20 }}>Date: ??/??</div>
        {line('kitchen job', '450')}
        {line('materials (approx)', '120 ?')}
        {line('misc', '', { color: '#999' })}
        <div style={{ marginTop: 22, fontSize: 26, fontWeight: 700 }}>
          TOTAL: <span style={{ textDecoration: 'line-through' }}>550</span> 570
        </div>
        <div style={{ marginTop: 8, fontStyle: 'italic' }}>(cash pls)</div>
        <div style={{ position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', fontSize: 15, color: '#888' }}>Page 1 of 1</div>
        {/* Coffee ring */}
        <div style={{ position: 'absolute', right: 30, bottom: 120, width: 150, height: 150, borderRadius: '50%', border: '9px solid rgba(120,80,30,0.28)', filter: 'blur(1.5px)' }} />
      </div>
      {/* Harsh flash hotspot and falloff */}
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 26% 30%, rgba(255,255,240,0.35) 0%, transparent 35%), radial-gradient(circle at 30% 50%, transparent 40%, rgba(0,0,0,0.55) 90%)' }} />
    </AbsoluteFill>
  );
};

/** "The pros": the real Invoice Them PDF, lit and slowly turning. */
export const ProDocument: React.FC<{ kind: 'estimate' | 'invoice'; len: number }> = ({ kind, len }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 10], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sweep = interpolate(f, [4, len], [-0.4, 1.3], CLAMP);
  const estimate = kind === 'estimate';
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 28% 40%, #3A3226 0%, #120F0B 60%, #070605 100%)', perspective: 2200 }}>
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 40,
          transformOrigin: '50% 50%',
          scale: 0.64 + f * 0.0012,
          transform: `rotateY(${18 - f * 0.25 - (1 - enter) * 20}deg) rotateX(${8 - f * 0.08}deg)`,
          translate: `${(1 - enter) * -260 - 100}px ${-110}px`,
          opacity: enter,
          filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.6))',
        }}
      >
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
          <PdfV2
            title={estimate ? 'Estimate' : 'Invoice'}
            meta={estimate ? 'EST-0017 · Valid 30 days' : 'INV-0042 · Due Oct 9'}
            payReveal={estimate ? 0 : 1}
            signature={estimate ? interpolate(f, [6, len - 4], [0, 1], CLAMP) : 1}
          />
          {/* A soft sheen travelling across the page */}
          <div
            style={{
              position: 'absolute',
              top: -200,
              bottom: -200,
              width: 260,
              left: `${sweep * 100}%`,
              rotate: '18deg',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
