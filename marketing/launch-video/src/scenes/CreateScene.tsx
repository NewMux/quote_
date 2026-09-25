import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SPRING, whipIn, whipOut } from '../anim';
import { Background } from '../components/Background';
import { Callout } from '../components/Bits';
import { Kinetic } from '../components/Kinetic';
import { Phone } from '../components/Phone';
import { EditorScreen } from '../screens/Screens';
import { C } from '../theme';

/** Frames (local) where each line item lands; the Add Item tap is 4 frames earlier. */
export const CREATE_ADDS = [24, 50, 76];

/** 10–14 s: tap, tap, tap — three line items and the totals add themselves up. */
export const CreateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = whipIn(frame, 8);
  const exit = whipOut(frame, 120, 8);
  const pulse = Math.exp(-(frame % 15) / 5);
  const push = frame / 120;

  return (
    <AbsoluteFill>
      <Background energy={1 + 0.15 * pulse} />
      <AbsoluteFill
        style={{
          translate: `${enter.p * 1400}px ${-exit.p * 1700}px`,
          filter: `blur(${enter.blur + exit.blur}px)`,
        }}
      >
        <div style={{ position: 'absolute', top: 190, left: 80, right: 80 }}>
          <Kinetic text="Invoices in *seconds.*" start={4} stagger={5} size={96} />
        </div>
        <Phone
          width={800}
          style={{
            left: 140,
            top: 500,
            scale: 1 + push * 0.06,
            transform: `perspective(2600px) rotateX(${8 - push * 3}deg) rotateY(${7 - push * 5}deg)`,
          }}
        >
          <EditorScreen f={frame} adds={CREATE_ADDS} />
        </Phone>
        <Callout
          icon="check"
          color={C.brand}
          title="Ready to send"
          value="$4,290.00"
          style={{
            right: 50,
            top: 1400 + Math.sin(frame / 12) * 8,
            opacity: interpolate(frame, [96, 102], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            scale: interpolate(frame, [96, 110], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING }),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
