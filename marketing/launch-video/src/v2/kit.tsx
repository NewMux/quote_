import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN, EASE_OUT } from '../anim';
import { FONT } from '../theme';
import { L, NIGHT } from './theme';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** The light stage: soft gray with two faint pools of the scene's accent color and a whisper of
 * grain. `accent` tints it per feature. */
export const Canvas: React.FC<{ accent: string; children?: React.ReactNode }> = ({ accent, children }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: L.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          left: -420 + Math.sin(t * 0.3) * 40,
          top: -520 + Math.cos(t * 0.25) * 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}26 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          right: -520 + Math.cos(t * 0.28) * 40,
          bottom: -380 + Math.sin(t * 0.22) * 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}1C 0%, transparent 60%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** Midnight stage with slow violet / coral / blue glows. */
export const NightCanvas: React.FC<{ children?: React.ReactNode; intensity?: number }> = ({ children, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const glows = [
    { c: NIGHT.violet, x: 18 + 8 * Math.sin(t * 0.3), y: 22 + 6 * Math.cos(t * 0.25), r: 1100, a: 0.55 },
    { c: NIGHT.coral, x: 88 + 6 * Math.cos(t * 0.27), y: 58 + 8 * Math.sin(t * 0.3), r: 1000, a: 0.38 },
    { c: NIGHT.blue, x: 30 + 10 * Math.sin(t * 0.22 + 1), y: 95 + 4 * Math.cos(t * 0.3), r: 1200, a: 0.5 },
  ];
  return (
    <AbsoluteFill style={{ background: NIGHT.bg, overflow: 'hidden' }}>
      {glows.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: g.r,
            height: g.r,
            marginLeft: -g.r / 2,
            marginTop: -g.r / 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${g.c} 0%, transparent 62%)`,
            opacity: g.a * intensity,
            filter: 'blur(30px)',
          }}
        />
      ))}
      {children}
    </AbsoluteFill>
  );
};

/** A small colored label above a headline: dot + word. */
export const Eyebrow: React.FC<{ text: string; color: string; at?: number; dark?: boolean }> = ({ text, color, at = 0, dark }) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        opacity: interpolate(f, [0, 10], [0, 1], CLAMP),
        translate: `0px ${interpolate(f, [0, 14], [14, 0], { ...CLAMP, easing: EASE_OUT })}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 26px',
          borderRadius: 999,
          background: dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
          boxShadow: dark ? 'none' : '0 6px 20px rgba(17,17,20,0.06)',
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: dark ? NIGHT.ink : L.ink,
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 8, background: color }} />
        {text}
      </div>
    </div>
  );
};

/** Masked line reveal: each line slides up from behind its own clip, one after another — calm and
 * very readable. *word* spans take the accent color. `outAt` slides the lines away again. */
export const LineReveal: React.FC<{
  lines: string[];
  accent: string;
  at?: number;
  stagger?: number;
  size?: number;
  color?: string;
  weight?: number;
  outAt?: number;
  align?: 'center' | 'left';
  /** Available width; the font shrinks so the longest line never wraps. */
  maxWidth?: number;
}> = ({ lines, accent, at = 0, stagger = 7, size = 104, color = L.ink, weight = 800, outAt, align = 'center', maxWidth = 930 }) => {
  const frame = useCurrentFrame();
  // Inter ExtraBold averages ~0.6em per character; size every line to the longest one.
  const longest = Math.max(...lines.map((l) => l.replace(/\*/g, '').length));
  const fitted = Math.min(size, maxWidth / (longest * 0.61));
  return (
    <div style={{ fontFamily: FONT, fontSize: fitted, whiteSpace: 'nowrap', fontWeight: weight, letterSpacing: '-0.04em', lineHeight: 1.08, color, textAlign: align }}>
      {lines.map((line, i) => {
        const f = frame - at - i * stagger;
        const out = outAt === undefined ? 0 : interpolate(frame - outAt - i * 3, [0, 14], [0, 1], { ...CLAMP, easing: EASE_IN });
        const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
        return (
          <div key={i} style={{ overflow: 'hidden', paddingBottom: fitted * 0.12, marginBottom: -fitted * 0.1 }}>
            <div
              style={{
                translate: `0px ${interpolate(f, [0, 18], [110, 0], { ...CLAMP, easing: EASE_OUT }) - out * 110}%`,
                opacity: interpolate(f, [0, 4], [0, 1], CLAMP) * (1 - out),
              }}
            >
              {parts.map((p, k) =>
                p.startsWith('*') ? (
                  <span key={k} style={{ color: accent }}>
                    {p.slice(1, -1)}
                  </span>
                ) : (
                  <span key={k}>{p}</span>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Caption block at the top of a scene: eyebrow + headline. */
export const Caption: React.FC<{ eyebrow: string; lines: string[]; accent: string; at?: number; outAt?: number; top?: number }> = ({
  eyebrow,
  lines,
  accent,
  at = 4,
  outAt,
  top = 150,
}) => (
  <div style={{ position: 'absolute', top, left: 70, right: 70 }}>
    <Eyebrow text={eyebrow} color={accent} at={at} />
    <div style={{ height: 30 }} />
    <LineReveal lines={lines} accent={accent} at={at + 6} outAt={outAt} size={96} />
  </div>
);

/** Calm scene edges: a short fade/lift in, and a gentle fade/settle out before the cut. */
export const SceneFade: React.FC<{ duration: number; children: React.ReactNode; inLen?: number; outLen?: number }> = ({
  duration,
  children,
  inLen = 10,
  outLen = 9,
}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, inLen], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const outP = interpolate(frame, [duration - outLen, duration], [0, 1], { ...CLAMP, easing: EASE_IN });
  return (
    <AbsoluteFill style={{ opacity: inP * (1 - outP), scale: 1 - outP * 0.03, translate: `0px ${(1 - inP) * 24}px` }}>{children}</AbsoluteFill>
  );
};

/** A white floating card with an icon tile, for callouts beside the phone. */
export const FloatCard: React.FC<{ icon: React.ReactNode; color: string; title: string; value: string; style?: React.CSSProperties }> = ({
  icon,
  color,
  title,
  value,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '22px 32px 22px 22px',
      borderRadius: 32,
      background: '#FFFFFF',
      boxShadow: '0 30px 60px rgba(17,17,20,0.16)',
      fontFamily: FONT,
      ...style,
    }}
  >
    <div style={{ width: 68, height: 68, borderRadius: 20, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, color: L.secondary, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em', color: L.ink }}>{value}</div>
    </div>
  </div>
);
