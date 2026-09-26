import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../../anim';
import { AppMark } from '../../components/Bits';
import { Icon } from '../../components/Icon';
import { FONT } from '../../theme';
import { LineReveal, NightCanvas } from '../kit';
import { NIGHT } from '../theme';
import { SCENES_V2 } from '../timing';

/** 38.4–45.6 s: the end card on midnight. Holds long enough to read, then fades out. */
export const FinaleV2: React.FC = () => {
  const frame = useCurrentFrame();
  const end = SCENES_V2.finale;
  const fade = interpolate(frame, [end - 24, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shine = interpolate(frame % 72, [20, 52], [-0.3, 1.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <NightCanvas intensity={1} />
      <AbsoluteFill style={{ scale: interpolate(frame, [0, end], [1, 1.04]) }}>
        <div
          style={{
            position: 'absolute',
            left: 540 - 360,
            top: 640 - 360,
            width: 720,
            height: 720,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(185,169,255,0.28) 0%, transparent 62%)',
          }}
        />
        <AppMark
          size={240}
          style={{
            position: 'absolute',
            left: 540 - 120,
            top: 520,
            scale: interpolate(frame, [0, 24], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING, output: 'perceptual-scale' }),
            opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        />
        <div style={{ position: 'absolute', top: 820, left: 60, right: 60 }}>
          <LineReveal lines={['Invoice Them']} accent="#B9A9FF" at={10} size={130} weight={900} color={NIGHT.ink} />
          <div style={{ height: 30 }} />
          <LineReveal lines={['Invoices, estimates & payments.', '*Simple.*']} accent="#B9A9FF" at={26} stagger={10} size={54} weight={600} color={NIGHT.secondary} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1260,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [50, 62], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            translate: `0px ${interpolate(frame, [50, 68], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
          }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '28px 54px',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#0B0D17',
              fontFamily: FONT,
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              boxShadow: '0 20px 60px rgba(123,97,255,0.35)',
            }}
          >
            <Icon name="download" size={44} color="#0B0D17" weight={2.6} />
            Now on the App Store
            <div
              style={{
                position: 'absolute',
                top: -40,
                bottom: -40,
                width: 110,
                left: `${shine * 100}%`,
                rotate: '20deg',
                background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.22), transparent)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1420,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 38,
            fontWeight: 500,
            color: NIGHT.secondary,
            opacity: interpolate(frame, [66, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          Try it free for a week
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: fade }} />
    </AbsoluteFill>
  );
};
