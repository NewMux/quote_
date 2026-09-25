import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { Background } from '../components/Background';
import { AppMark, Callout, Glass } from '../components/Bits';
import { Icon } from '../components/Icon';
import { Kinetic } from '../components/Kinetic';
import { C, FONT, GRADIENT_TEXT } from '../theme';

const NAME = 'Invoice Them';
/** Local frame of the outro hit (30 s). */
export const FINAL_HIT = 120;

/** 26–32 s: final drop and end card. */
export const LockupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = frame < FINAL_HIT ? Math.exp(-(frame % 15) / 5) : 0;
  const hit = interpolate(frame, [FINAL_HIT, FINAL_HIT + 3, FINAL_HIT + 14], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const push = interpolate(frame, [0, 180], [1, 1.07]);
  const fadeOut = interpolate(frame, [168, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shine = interpolate(frame % 60, [10, 34], [-0.3, 1.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const float = (phase: number) => Math.sin(frame / 16 + phase) * 12;
  const cardIn = (at: number) => ({
    opacity: interpolate(frame, [at, at + 8], [0, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    scale: interpolate(frame, [at, at + 16], [0.7, 0.82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING }),
  });

  return (
    <AbsoluteFill>
      <Background energy={1.2 + 0.2 * pulse + hit * 0.5} />
      <AbsoluteFill style={{ scale: push + hit * 0.04 }}>
        <Callout icon="checkCircle" color={C.green} title="Paid" value="$4,290.00" style={{ left: 30, top: 170 + float(0), ...cardIn(26) }} />
        <Callout icon="bell" color={C.orange} title="Reminder sent" value="INV-0038" style={{ right: 60, top: 330 + float(1.5), ...cardIn(34) }} />
        <Callout icon="signature" color={C.brand} title="Signed" value="Harbor Coffee" style={{ left: 40, top: 1560 + float(3), ...cardIn(42) }} />

        <div
          style={{
            position: 'absolute',
            left: 540 - 450,
            top: 700 - 450,
            width: 900,
            height: 900,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(76,211,165,0.4) 0%, transparent 62%)',
          }}
        />
        <AppMark
          size={260}
          style={{
            position: 'absolute',
            left: 540 - 130,
            top: 580,
            scale: interpolate(frame, [0, 16], [0.4, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING, output: 'perceptual-scale' }),
            translate: `0px ${Math.sin(frame / 20) * 8}px`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 880,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: FONT,
            fontSize: 128,
            fontWeight: 900,
            letterSpacing: '-0.045em',
            color: C.label,
          }}
        >
          {NAME.split('').map((ch, i) => {
            const f = frame - 4 - i * 1.2;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  opacity: interpolate(f, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  translate: `0px ${interpolate(f, [0, 12], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
                  filter: `blur(${interpolate(f, [0, 8], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                  ...(i >= 8 ? GRADIENT_TEXT : null),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ position: 'absolute', top: 1080, left: 80, right: 80 }}>
          <Kinetic text="Invoices, estimates & payments." start={18} stagger={3} size={48} weight={600} color={C.secondary} />
          <Kinetic text="*Simple.*" start={34} size={92} style={{ marginTop: 8 }} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1360,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [44, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            scale: interpolate(frame, [44, 60], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING }),
          }}
        >
          <Glass radius={60} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20, padding: '28px 54px', background: `linear-gradient(160deg, rgba(76,211,165,0.35), rgba(21,122,99,0.35))` }}>
            <Icon name="download" size={46} color="#fff" weight={2.6} />
            <span style={{ fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em' }}>Now on the App Store</span>
            <div
              style={{
                position: 'absolute',
                top: -40,
                bottom: -40,
                width: 120,
                left: `${shine * 100}%`,
                rotate: '20deg',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              }}
            />
          </Glass>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: interpolate(frame, [0, 8], [0.7, 0], { extrapolateRight: 'clamp' }) + hit * 0.25 }} />
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
