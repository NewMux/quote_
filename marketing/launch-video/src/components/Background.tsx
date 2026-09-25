import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { C } from '../theme';

/** Near-black stage with slowly drifting teal/mint light, film grain and a vignette: the
 * "aurora" backdrop common in current product launch films. `energy` brightens it on drops. */
export const Background: React.FC<{ energy?: number; hue?: 'teal' | 'mint' }> = ({ energy = 1, hue = 'teal' }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const blobs = [
    { x: 20 + 12 * Math.sin(t * 0.5), y: 18 + 8 * Math.cos(t * 0.4), r: 900, color: hue === 'teal' ? C.brand : C.mint, a: 0.55 },
    { x: 85 + 10 * Math.cos(t * 0.35), y: 55 + 10 * Math.sin(t * 0.45), r: 800, color: C.tint, a: 0.28 },
    { x: 30 + 14 * Math.sin(t * 0.3 + 2), y: 92 + 6 * Math.cos(t * 0.5), r: 1000, color: C.brandDark, a: 0.7 },
  ];
  // Grain: a turbulence texture shifted to a new random offset every frame.
  const gx = Math.floor(random(`gx${frame}`) * 200);
  const gy = Math.floor(random(`gy${frame}`) * 200);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: 'hidden' }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.r,
            height: b.r,
            marginLeft: -b.r / 2,
            marginTop: -b.r / 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 65%)`,
            opacity: Math.min(1, b.a * energy),
            filter: 'blur(40px)',
          }}
        />
      ))}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect x={-gx} y={-gy} width="130%" height="130%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)' }} />
    </AbsoluteFill>
  );
};
