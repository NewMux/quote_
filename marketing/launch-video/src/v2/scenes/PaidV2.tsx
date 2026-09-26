import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SPRING, money } from '../../anim';
import { Icon } from '../../components/Icon';
import { Phone } from '../../components/Phone';
import { Canvas, Caption, FloatCard, SceneFade } from '../kit';
import { DetailLight } from '../screens';
import { ACCENT, SOFT_SHADOW } from '../theme';
import { SCENES_V2 } from '../timing';
import { FONT } from '../../theme';

export const PAID = { banner: 30, paid: 56, stat: 84 };

/** 26.4–31.2 s: the payment arrives — notification, Issued → Paid, and the month's total climbs. */
export const PaidV2: React.FC = () => {
  const frame = useCurrentFrame();
  const banner = interpolate(frame, [PAID.banner, PAID.banner + 14, PAID.banner + 60, PAID.banner + 74], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const monthTotal = interpolate(frame, [PAID.stat, PAID.stat + 30], [8550, 12840], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.indigo} />
      <SceneFade duration={SCENES_V2.paid}>
        <Caption eyebrow="Tracking" lines={['Get paid.', '*Track it all.*']} accent={ACCENT.indigo} />
        <Phone width={740} lightScreen shadow={SOFT_SHADOW} style={{ left: 170, top: 660, transform: `perspective(2600px) rotateX(6deg) rotateY(${-4 + frame / 60}deg)` }}>
          <DetailLight f={frame} paidAt={PAID.paid} />
        </Phone>
        {/* Notification banner, iOS style */}
        <div
          style={{
            position: 'absolute',
            left: 110,
            right: 110,
            top: 600,
            padding: '22px 26px',
            borderRadius: 36,
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 24px 50px rgba(17,17,20,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontFamily: FONT,
            opacity: banner,
            translate: `0px ${(1 - banner) * -60}px`,
            zIndex: 5,
          }}
        >
          <div style={{ width: 70, height: 70, borderRadius: 16, background: 'linear-gradient(150deg, #2FB58C, #157A63)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#111114' }}>Payment received</div>
            <div style={{ fontSize: 26, color: '#3A3A3F' }}>Harbor Coffee Co. paid $4,290.00</div>
          </div>
          <div style={{ fontSize: 22, color: '#8E8E93', alignSelf: 'flex-start' }}>now</div>
        </div>
        <FloatCard
          icon={<Icon name="checkCircle" size={40} color="#fff" weight={2.4} />}
          color={ACCENT.indigo}
          title="Paid this month"
          value={money(monthTotal).replace('.00', '')}
          style={{
            left: 110,
            top: 1680 + Math.sin(frame / 16) * 8,
            opacity: interpolate(frame, [PAID.stat, PAID.stat + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            scale: interpolate(frame, [PAID.stat, PAID.stat + 16], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING }),
          }}
        />
      </SceneFade>
    </AbsoluteFill>
  );
};
