import React from 'react';
import { AbsoluteFill } from 'remotion';
import { STORE_H, STORE_W } from './layout';
import { SHOTS } from './shots';

const SCALE = 0.3;
const GAP = 40;
const PAD = 70;

export const STRIP_W = Math.round(PAD * 2 + SHOTS.length * STORE_W * SCALE + (SHOTS.length - 1) * GAP);
export const STRIP_H = Math.round(PAD * 2 + STORE_H * SCALE);

/** All six screenshots side by side on a plain backdrop: the preview image for sharing, not an
 * App Store upload. */
export const StoreStrip: React.FC = () => (
  <AbsoluteFill style={{ background: '#E8E2D9' }}>
    {SHOTS.map(({ id, Component }, i) => (
      <div
        key={id}
        style={{
          position: 'absolute',
          left: PAD + i * (STORE_W * SCALE + GAP),
          top: PAD,
          width: STORE_W,
          height: STORE_H,
          scale: SCALE,
          transformOrigin: '0% 0%',
          borderRadius: 120,
          overflow: 'hidden',
        }}
      >
        <Component />
      </div>
    ))}
  </AbsoluteFill>
);
