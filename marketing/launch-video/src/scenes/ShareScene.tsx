import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN, EASE_OUT, SPRING, whipOut } from '../anim';
import { Background } from '../components/Background';
import { Icon } from '../components/Icon';
import { Kinetic } from '../components/Kinetic';
import { Phone } from '../components/Phone';
import { DetailScreen, PdfPaper, ShareSheet } from '../screens/Screens';
import { C } from '../theme';

/** Local frame of the tap on Mail in the share sheet (the sheet starts at SHEET_IN). */
export const SHEET_IN = 60;
export const MAIL_TAP = 92;

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 16–20 s: the PDF flies out of the phone, then the share sheet sends it. */
export const ShareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = whipOut(frame, 120, 8);
  const pulse = Math.exp(-(frame % 15) / 5);

  const fly = interpolate(frame, [2, 30], [0, 1], { ...CLAMP, easing: SPRING });
  const away = interpolate(frame, [54, 68], [0, 1], { ...CLAMP, easing: EASE_IN });
  const toFront = interpolate(frame, [52, 72], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sheet = interpolate(frame, [SHEET_IN, SHEET_IN + 14], [1, 0], { ...CLAMP, easing: SPRING });
  const shine = interpolate(frame, [30, 48], [-0.4, 1.4], CLAMP);
  const plane = interpolate(frame, [MAIL_TAP + 2, MAIL_TAP + 20], [0, 1], { ...CLAMP, easing: EASE_IN });

  return (
    <AbsoluteFill>
      <Background energy={1 + 0.15 * pulse} />
      <AbsoluteFill style={{ translate: `${-exit.p * 1400}px 0px`, filter: `blur(${exit.blur}px)` }}>
        <div style={{ position: 'absolute', top: 150, left: 80, right: 80 }}>
          <Kinetic text="Send a *polished* PDF." start={2} stagger={5} size={92} />
        </div>
        <Phone
          width={760}
          glow={toFront}
          style={{
            left: interpolate(toFront, [0, 1], [-120, 160]),
            top: interpolate(toFront, [0, 1], [760, 400]),
            scale: interpolate(toFront, [0, 1], [0.86, 1]),
            opacity: interpolate(toFront, [0, 1], [0.8, 1]),
            transform: `perspective(2600px) rotateY(${interpolate(toFront, [0, 1], [26, 3])}deg) rotateX(${interpolate(toFront, [0, 1], [8, 4])}deg)`,
          }}
        >
          <DetailScreen f={0} tapAt={9999} paidAt={9999} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 1 - sheet }} />
          <div style={{ position: 'absolute', inset: 0, translate: `0px ${sheet * 470}px` }}>
            <ShareSheet f={frame - SHEET_IN} tapAt={MAIL_TAP - SHEET_IN} />
          </div>
        </Phone>
        {/* The PDF */}
        <div
          style={{
            position: 'absolute',
            left: 260,
            top: 470,
            width: 640,
            height: 905,
            translate: `${interpolate(fly, [0, 1], [-260, 0]) + away * 900}px ${interpolate(fly, [0, 1], [820, 0]) + away * 300}px`,
            scale: interpolate(fly, [0, 1], [0.22, 0.92]) * (1 - away * 0.3),
            rotate: `${interpolate(fly, [0, 1], [-24, -4]) + away * 18 + Math.sin(frame / 18) * 0.8}deg`,
            opacity: interpolate(frame, [2, 8], [0, 1], CLAMP) * (1 - away),
            transform: `perspective(2600px) rotateY(${-16 + fly * 8}deg)`,
          }}
        >
          <PdfPaper />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: -200,
                bottom: -200,
                width: 180,
                left: `${shine * 100}%`,
                rotate: '20deg',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)',
                mixBlendMode: 'overlay',
              }}
            />
          </div>
        </div>
        {/* Sent: a paper plane leaves from the Mail icon. */}
        {frame >= MAIL_TAP + 2
          ? [0, 1, 2, 3].map((k) => {
              const p = Math.max(0, plane - k * 0.06);
              return (
                <div
                  key={k}
                  style={{
                    position: 'absolute',
                    left: interpolate(p, [0, 1], [290, 1150]),
                    top: interpolate(p, [0, 1], [1390, -120]) - Math.sin(p * Math.PI) * 180,
                    opacity: (k === 0 ? 1 : 0.35 / k) * interpolate(p, [0, 0.1], [0, 1], CLAMP),
                    rotate: `${-10 + p * 20}deg`,
                  }}
                >
                  <Icon name="paperplane" size={120 - k * 12} color={C.mint} weight={2.2} />
                </div>
              );
            })
          : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
