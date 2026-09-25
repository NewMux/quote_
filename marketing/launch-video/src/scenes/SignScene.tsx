import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN, whipIn } from '../anim';
import { Background } from '../components/Background';
import { Kinetic } from '../components/Kinetic';
import { Phone } from '../components/Phone';
import { SignScreen } from '../screens/Screens';

export const SIGN_DRAW = { start: 4, end: 38, done: 42 };

/** 14–16 s: the signature writes itself, then a zoom-through into the PDF. */
export const SignScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = whipIn(frame, 8);
  const zoom = interpolate(frame, [52, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN });
  const pulse = Math.exp(-(frame % 15) / 5);

  return (
    <AbsoluteFill>
      <Background energy={1 + 0.15 * pulse} hue="mint" />
      <AbsoluteFill
        style={{
          translate: `0px ${enter.p * 1700}px`,
          filter: `blur(${enter.blur + zoom * 30}px)`,
          scale: 1 + zoom * 1.8,
          opacity: 1 - zoom * 0.6,
          transformOrigin: '50% 58%',
        }}
      >
        <div style={{ position: 'absolute', top: 190, left: 80, right: 80 }}>
          <Kinetic text="Signed on the *spot.*" start={2} stagger={5} size={96} />
        </div>
        <Phone width={800} style={{ left: 140, top: 500, transform: `perspective(2600px) rotateX(6deg) rotateZ(${-2 + frame / 60}deg)` }}>
          <SignScreen f={frame} drawStart={SIGN_DRAW.start} drawEnd={SIGN_DRAW.end} doneAt={SIGN_DRAW.done} />
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
