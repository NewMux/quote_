import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { ACCENT, L } from '../v2/theme';
import { FPS, type SceneAr, type Word, startAr } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Cairo carries the Arabic; Latin letters and digits fall through to Inter. */
export const AR_FONT = 'Cairo, Inter, system-ui, sans-serif';

/** Word prefixes: `*` takes the scene's accent, `+` green (paid), `!` orange (still owed). */
const KEYWORD = {
  '*': undefined,
  '+': ACCENT.green,
  '!': ACCENT.orange,
} as const;

/**
 * The headline of a scene, and its subtitles at once: each word pops in on its onset in the
 * voiceover, so the screen reads along with the voice. The lines run right to left; a `*` / `+` / `!`
 * prefix on a word gives it a keyword color. All words are laid out from the start (hidden until spoken), so
 * nothing reflows as the line fills.
 */
export const ArCaption: React.FC<{
  scene: SceneAr;
  lines: Word[][];
  accent: string;
  top?: number;
  size?: number;
  color?: string;
  /** Frames before the scene's end at which the words slide away. */
  outLen?: number;
  duration: number;
}> = ({ scene, lines, accent, top = 220, size = 104, color = L.ink, duration, outLen = 8 }) => {
  const frame = useCurrentFrame();
  const start = startAr(scene);
  const out = outLen > 0 ? interpolate(frame, [duration - outLen, duration], [0, 1], CLAMP) : 0;
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top,
        left: 50,
        right: 50,
        fontFamily: AR_FONT,
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1.32,
        color,
        textAlign: 'center',
        opacity: 1 - out,
        translate: `0px ${out * -24}px`,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: size * 0.26,
            whiteSpace: 'nowrap',
          }}
        >
          {line.map((w, k) => {
            const mark = w.text[0] in KEYWORD ? (w.text[0] as keyof typeof KEYWORD) : undefined;
            const at = Math.round(w.at * FPS) - start - 2;
            const f = frame - at;
            return (
              <span
                key={k}
                style={{
                  display: 'inline-block',
                  color: mark ? (KEYWORD[mark] ?? accent) : color,
                  opacity: interpolate(f, [0, 5], [0, 1], CLAMP),
                  translate: `0px ${interpolate(f, [0, 16], [34, 0], { ...CLAMP, easing: EASE_OUT })}px`,
                  scale: interpolate(f, [0, 14], [0.86, 1], {
                    ...CLAMP,
                    easing: SPRING,
                    output: 'perceptual-scale',
                  }),
                }}
              >
                {mark ? w.text.slice(1) : w.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
