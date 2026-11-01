import React from 'react';
import { AbsoluteFill } from 'remotion';
import { STORE_H, STORE_W } from './design';
import { SHOTS, SHOTS_AR } from './shots';

const SCALE = 0.26;
const GAP = 40;
const PAD = 70;

export const STRIP_W = Math.round(PAD * 2 + SHOTS.length * STORE_W * SCALE + (SHOTS.length - 1) * GAP);
export const STRIP_H = Math.round(PAD * 2 + STORE_H * SCALE);

const Strip: React.FC<{ shots: typeof SHOTS | typeof SHOTS_AR; rtl?: boolean }> = ({ shots, rtl }) => (
  <AbsoluteFill style={{ background: '#E8E2D9' }}>
    {shots.map(({ id, Component }, i) => (
      <div
        key={id}
        style={{
          position: 'absolute',
          // The Arabic strip reads right to left: the first shot sits at the right edge.
          left: PAD + (rtl ? shots.length - 1 - i : i) * (STORE_W * SCALE + GAP),
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

/** All the screenshots side by side on a plain backdrop: the preview image for sharing, not an
 * App Store upload. */
export const StoreStrip: React.FC = () => <Strip shots={SHOTS} />;
export const StoreStripAr: React.FC = () => <Strip shots={SHOTS_AR} rtl />;
