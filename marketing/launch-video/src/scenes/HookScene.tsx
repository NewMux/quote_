import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN, EASE_OUT } from '../anim';
import { Background } from '../components/Background';
import { Kinetic } from '../components/Kinetic';
import { C } from '../theme';

/** 0–4 s, the filtered intro: the problem, crossed out, then the promise. Words land on beats. */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [60, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });
  const recede = interpolate(frame, [74, 88], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });
  const zoom = interpolate(frame, [108, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN });

  return (
    <AbsoluteFill>
      <Background energy={0.55 + 0.45 * interpolate(frame, [0, 120], [0, 1])} />
      <AbsoluteFill style={{ scale: 1 + zoom * 2.4, filter: `blur(${zoom * 30}px)`, opacity: 1 - zoom }}>
        <div
          style={{
            position: 'absolute',
            top: 520,
            left: 80,
            right: 80,
            opacity: 1 - recede * 0.7,
            translate: `0px ${-recede * 180}px`,
            scale: 1 - recede * 0.12,
            filter: `blur(${recede * 6}px)`,
          }}
        >
          <Kinetic text="Still making" start={0} stagger={8} size={112} />
          <Kinetic text="invoices in" start={16} stagger={8} size={112} />
          <div style={{ position: 'relative' }}>
            <Kinetic text="spreadsheets?" start={32} size={112} color={C.secondary} />
            <div
              style={{
                position: 'absolute',
                left: 110,
                right: 110,
                top: '46%',
                height: 12,
                borderRadius: 6,
                background: C.red,
                transformOrigin: 'left center',
                scale: `${strike} 1`,
                boxShadow: '0 0 30px rgba(255,105,97,0.7)',
              }}
            />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 1060, left: 80, right: 80 }}>
          <Kinetic text="There's a *better* way." start={86} stagger={5} size={118} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
