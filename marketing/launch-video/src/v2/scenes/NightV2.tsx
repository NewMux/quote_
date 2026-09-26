import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN_OUT } from '../anim2';
import { Canvas, LineReveal, NightCanvas } from '../kit';
import { ACCENT, NIGHT } from '../theme';

/** 36–38.4 s: a circle of midnight opens from the center, carrying the promise into the finale. */
export const NightV2: React.FC = () => {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [0, 30], [0, 1250], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.blue} />
      <AbsoluteFill style={{ clipPath: `circle(${r}px at 50% 50%)` }}>
        <NightCanvas intensity={0.8} />
        <div style={{ position: 'absolute', top: 760, left: 60, right: 60 }}>
          <LineReveal lines={['Everything you need', 'to *get paid.*']} accent="#B9A9FF" at={18} stagger={9} size={96} color={NIGHT.ink} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
