import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SPRING } from '../../anim';
import { AppMark } from '../../components/Bits';
import { Canvas, LineReveal, SceneFade } from '../kit';
import { ACCENT, L } from '../theme';
import { SCENES_V2 } from '../timing';

/** 4.8–7.2 s: the app mark and name. */
export const IntroV2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.violet} />
      <SceneFade duration={SCENES_V2.intro} inLen={1}>
        <AppMark
          size={250}
          style={{
            position: 'absolute',
            left: 540 - 125,
            top: 560,
            scale: interpolate(frame, [0, 22], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING, output: 'perceptual-scale' }),
            opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        />
        <div style={{ position: 'absolute', top: 880, left: 60, right: 60 }}>
          <LineReveal lines={['Invoice Them']} accent={ACCENT.violet} at={12} size={128} weight={900} />
          <div style={{ height: 26 }} />
          <LineReveal lines={['Invoices, made *simple.*']} accent={ACCENT.violet} at={24} size={58} weight={600} color={L.secondary} />
        </div>
      </SceneFade>
    </AbsoluteFill>
  );
};
