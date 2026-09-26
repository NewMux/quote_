import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT } from '../../anim';
import { Icon, type IconName } from '../../components/Icon';
import { FONT } from '../../theme';
import { Canvas, LineReveal, SceneFade } from '../kit';
import { ACCENT, L } from '../theme';
import { SCENES_V2 } from '../timing';

type Card = { icon: IconName; title: string; sub: string; color: string; x: number; y: number; w: number; h: number };

const G = 24;
const W = 940;
const HALF = (W - G) / 2;

export const BENTO: Card[] = [
  { icon: 'repeat', title: 'Recurring invoices', sub: 'Monthly clients billed on schedule', color: ACCENT.blue, x: 0, y: 0, w: W, h: 210 },
  { icon: 'bell', title: 'Reminders', sub: 'For overdue invoices', color: ACCENT.orange, x: 0, y: 210 + G, w: HALF, h: 290 },
  { icon: 'photo', title: 'Your logo', sub: 'On every PDF', color: ACCENT.pink, x: HALF + G, y: 210 + G, w: HALF, h: 290 },
  { icon: 'moon', title: 'Light & Dark', sub: 'Looks right, day or night', color: ACCENT.violet, x: 0, y: 500 + 2 * G, w: HALF, h: 290 },
  { icon: 'arrowRight', title: 'Estimates', sub: 'Turn into invoices in a tap', color: ACCENT.indigo, x: HALF + G, y: 500 + 2 * G, w: HALF, h: 290 },
  { icon: 'lock', title: 'Secure cloud sync', sub: 'Your data, on every device', color: '#111114', x: 0, y: 790 + 3 * G, w: W, h: 190 },
];

/** 31.2–36 s: everything else, as a bento grid that assembles card by card and then holds. */
export const BentoV2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.blue} />
      <SceneFade duration={SCENES_V2.bento}>
        <div style={{ position: 'absolute', top: 170, left: 70, right: 70 }}>
          <LineReveal lines={['And so much *more.*']} accent={ACCENT.violet} at={4} size={96} />
        </div>
        <div style={{ position: 'absolute', left: 70, top: 440, width: W }}>
          {BENTO.map((card, i) => {
            const f = frame - 20 - i * 9;
            const wide = card.w === W;
            return (
              <div
                key={card.title}
                style={{
                  position: 'absolute',
                  left: card.x,
                  top: card.y,
                  width: card.w,
                  height: card.h,
                  borderRadius: 40,
                  background: '#FFFFFF',
                  boxShadow: '0 20px 50px rgba(17,17,20,0.08)',
                  padding: 34,
                  display: 'flex',
                  flexDirection: wide ? 'row' : 'column',
                  alignItems: wide ? 'center' : 'flex-start',
                  justifyContent: wide ? 'flex-start' : 'space-between',
                  gap: 28,
                  fontFamily: FONT,
                  opacity: interpolate(f, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  translate: `0px ${interpolate(f, [0, 20], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
                  scale: interpolate(f, [0, 20], [0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT }),
                }}
              >
                <div style={{ width: 96, height: 96, borderRadius: 28, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={card.icon} size={54} color="#fff" weight={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', color: L.ink, lineHeight: 1.1 }}>{card.title}</div>
                  <div style={{ fontSize: 30, fontWeight: 500, color: L.secondary, marginTop: 8, lineHeight: 1.25 }}>{card.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SceneFade>
    </AbsoluteFill>
  );
};
