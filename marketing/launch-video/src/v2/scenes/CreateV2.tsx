import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SPRING } from '../../anim';
import { Phone } from '../../components/Phone';
import { Canvas, Caption, SceneFade } from '../kit';
import { EditorLight } from '../screens';
import { ACCENT, SOFT_SHADOW } from '../theme';
import { SCENES_V2 } from '../timing';

export const CREATE_ADDS = [40, 66, 92];

/** 7.2–12 s: three taps, three line items, totals add up. */
export const CreateV2: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 28], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.blue} />
      <SceneFade duration={SCENES_V2.create}>
        <Caption eyebrow="Invoices" lines={['Create an invoice', 'in *seconds.*']} accent={ACCENT.blue} />
        <Phone
          width={740}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{ left: 170, top: 660 + rise * 700, transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${-5 + frame / 60}deg)` }}
        >
          <EditorLight f={frame} adds={CREATE_ADDS} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};
