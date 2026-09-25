import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING, whipOut } from '../anim';
import { Background } from '../components/Background';
import { AppMark } from '../components/Bits';
import { C, FONT, GRADIENT_TEXT } from '../theme';

const NAME = 'Invoice Them';

/** 4–6 s, the drop: flash, camera shake, shockwave, and the name letter by letter. */
export const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = Math.max(0, 1 - frame / 14) * 16;
  const exit = whipOut(frame, 60, 8);
  const pulse = Math.exp(-(frame % 15) / 5);

  return (
    <AbsoluteFill>
      <Background energy={1.25 + 0.2 * pulse} />
      <AbsoluteFill
        style={{
          translate: `${(random(`x${frame}`) - 0.5) * shake - exit.p * 1300}px ${(random(`y${frame}`) - 0.5) * shake}px`,
          filter: `blur(${exit.blur}px)`,
        }}
      >
        {[0, 5].map((delay) => (
          <div
            key={delay}
            style={{
              position: 'absolute',
              left: 540 - 200,
              top: 760 - 200,
              width: 400,
              height: 400,
              borderRadius: '50%',
              border: `${delay ? 3 : 6}px solid ${C.mint}`,
              scale: interpolate(frame - delay, [0, 28], [0.5, 4.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT }),
              opacity: interpolate(frame - delay, [0, 28], [0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: 540 - 450,
            top: 760 - 450,
            width: 900,
            height: 900,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(76,211,165,0.45) 0%, transparent 60%)`,
            opacity: interpolate(frame, [0, 10, 60], [0, 1, 0.6], { extrapolateRight: 'clamp' }),
          }}
        />
        <AppMark
          size={300}
          style={{
            position: 'absolute',
            left: 540 - 150,
            top: 760 - 150,
            scale: interpolate(frame, [0, 18], [0.2, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING, output: 'perceptual-scale' }),
            rotate: `${interpolate(frame, [0, 18], [-16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING })}deg`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 990,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: FONT,
            fontSize: 132,
            fontWeight: 900,
            letterSpacing: '-0.045em',
            color: C.label,
          }}
        >
          {NAME.split('').map((ch, i) => {
            const f = frame - 8 - i * 1.3;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  opacity: interpolate(f, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  translate: `0px ${interpolate(f, [0, 12], [70, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
                  filter: `blur(${interpolate(f, [0, 8], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
                  ...(i >= 8 ? GRADIENT_TEXT : null),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 1190,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 50,
            fontWeight: 500,
            color: C.secondary,
            letterSpacing: '-0.01em',
            opacity: interpolate(frame, [26, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            translate: `0px ${interpolate(frame, [26, 38], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
          }}
        >
          Invoices. Estimates. Payments.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: interpolate(frame, [0, 7], [0.55, 0], { extrapolateRight: 'clamp' }) }} />
    </AbsoluteFill>
  );
};
