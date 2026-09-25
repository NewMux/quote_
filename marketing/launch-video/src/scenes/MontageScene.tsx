import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { EASE_IN, SPRING } from '../anim';
import { Background } from '../components/Background';
import { Glass } from '../components/Bits';
import { Icon, type IconName } from '../components/Icon';
import { Kinetic } from '../components/Kinetic';
import { C, FONT } from '../theme';

export const FEATURES: [IconName, string, string][] = [
  ['arrowRight', 'Estimates → Invoices', C.brand],
  ['repeat', 'Recurring invoices', '#2F80ED'],
  ['bell', 'Overdue reminders', '#E8872B'],
  ['photo', 'Your logo on every PDF', '#9B6BF2'],
  ['moon', 'Light & Dark Mode', '#5E5CE6'],
  ['lock', 'Secure cloud sync', '#23A55A'],
];

/** 22–26 s, the breakdown: one feature slams in per beat, then the build pulls everything in. */
export const MontageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const build = interpolate(frame, [90, 112], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [110, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN });
  const shake = build * 7;

  return (
    <AbsoluteFill>
      <Background energy={0.8 + build * 0.6} hue="mint" />
      <AbsoluteFill
        style={{
          scale: 1 + build * 0.05 + out * 1.6,
          filter: `blur(${out * 26}px)`,
          opacity: 1 - out * 0.8,
          translate: `${(random(`mx${frame}`) - 0.5) * shake}px ${(random(`my${frame}`) - 0.5) * shake}px`,
        }}
      >
        <div style={{ position: 'absolute', top: 250, left: 80, right: 80 }}>
          <Kinetic text="And so much *more.*" start={0} stagger={4} size={96} />
        </div>
        {FEATURES.map(([icon, label, color], i) => {
          const f = frame - 8 - i * 15;
          return (
            <Glass
              key={label}
              radius={44}
              style={{
                position: 'absolute',
                left: 90,
                right: 90,
                top: 540 + i * 172,
                height: 140,
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                padding: '0 36px',
                opacity: interpolate(f, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                scale: interpolate(f, [0, 10], [1.45, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING, output: 'perceptual-scale' }),
                filter: `blur(${interpolate(f, [0, 7], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
              }}
            >
              <div style={{ width: 84, height: 84, borderRadius: 24, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={icon} size={48} color="#fff" weight={2.3} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: 52, fontWeight: 700, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>{label}</div>
            </Glass>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
