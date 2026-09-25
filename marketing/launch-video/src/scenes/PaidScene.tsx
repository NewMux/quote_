import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { whipIn, whipOut } from '../anim';
import { Background } from '../components/Background';
import { Burst } from '../components/Bits';
import { Kinetic } from '../components/Kinetic';
import { Phone } from '../components/Phone';
import { DetailScreen } from '../screens/Screens';

export const PAID = { tap: 14, paid: 20 };

/** 20–22 s: Log Payment → the status flips to Paid with a burst. */
export const PaidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = whipIn(frame, 8);
  const exit = whipOut(frame, 60, 8);
  const pulse = Math.exp(-(frame % 15) / 5);

  return (
    <AbsoluteFill>
      <Background energy={1.05 + 0.2 * pulse} hue="mint" />
      <AbsoluteFill
        style={{
          translate: `${enter.p * 1400}px ${-exit.p * 1700}px`,
          filter: `blur(${enter.blur + exit.blur}px)`,
        }}
      >
        <div style={{ position: 'absolute', top: 170, left: 80, right: 80 }}>
          <Kinetic text="Get paid." start={0} stagger={4} size={96} />
          <Kinetic text="*Track it all.*" start={8} stagger={4} size={96} />
        </div>
        <Phone width={760} style={{ left: 160, top: 470, transform: `perspective(2600px) rotateX(6deg) rotateY(${-4 + frame / 30}deg)` }}>
          <DetailScreen f={frame} tapAt={PAID.tap} paidAt={PAID.paid} />
        </Phone>
        <Burst at={PAID.paid} x={540} y={1150} count={44} spread={620} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
