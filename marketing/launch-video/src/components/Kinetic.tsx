import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { C, FONT, GRADIENT_TEXT } from '../theme';

/** Kinetic headline: each word lands on its own frame, rising from a blur with a springy scale —
 * the word-by-word reveal used in most current launch films. Words wrapped in *asterisks* get the
 * mint gradient; the span may cover several words. */
export const Kinetic: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({ text, start = 0, stagger = 4, size = 96, weight = 800, color = C.label, lineHeight = 1.05, style }) => {
  const frame = useCurrentFrame();
  // A highlight can span several words: "*Track it all.*".
  let open = false;
  const words = text.split(' ').map((raw) => {
    const starts = raw.startsWith('*');
    const ends = raw.endsWith('*') && (raw.length > 1 || !starts);
    const highlighted = open || starts;
    if (starts) open = true;
    if (ends) open = false;
    return { word: raw.replace(/\*/g, ''), highlighted };
  });
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.26,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.035em',
        lineHeight,
        color,
        textAlign: 'center',
        ...style,
      }}
    >
      {words.map(({ word, highlighted }, i) => {
        const f = frame - start - i * stagger;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: interpolate(f, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              translate: `0px ${interpolate(f, [0, 14], [size * 0.55, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
              scale: interpolate(f, [0, 16], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING }),
              filter: `blur(${interpolate(f, [0, 10], [18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
              paddingBottom: size * 0.08,
              ...(highlighted ? GRADIENT_TEXT : null),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
