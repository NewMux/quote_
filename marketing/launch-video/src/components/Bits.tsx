import React from 'react';
import { interpolate, random, useCurrentFrame } from 'remotion';
import { EASE_OUT } from '../anim';
import { C, FONT } from '../theme';
import { Icon, type IconName } from './Icon';

/** Placeholder app mark (until the real icon exists): a teal squircle with a document glyph and
 * a checkmark, echoing "invoice" and "paid". */
export const AppMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.225,
      background: `linear-gradient(150deg, #2FB58C 0%, ${C.brand} 55%, ${C.brandDarker} 100%)`,
      boxShadow: `inset 0 ${size * 0.01}px ${size * 0.02}px rgba(255,255,255,0.35), 0 ${size * 0.08}px ${size * 0.2}px rgba(21,122,99,0.55)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      ...style,
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 2.5h7.5l4.5 4.5v13.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z" fill="rgba(255,255,255,0.14)" />
      <path d="M13.5 2.5v5h5" />
      <path d="M8.5 11h5M8.5 14h3" />
      <path d="m10.5 17.3 1.8 1.8 3.7-3.7" stroke={C.mint} strokeWidth={2} />
    </svg>
  </div>
);

/** An iOS touch indicator: a soft dot that presses in and releases a ring. `at` is the frame the
 * tap happens; x/y are in the parent's coordinates. */
export const TapRipple: React.FC<{ at: number; x: number; y: number; size?: number }> = ({ at, x, y, size = 44 }) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < -6 || f > 18) return null;
  const dot = interpolate(f, [-6, 0, 4, 12], [0, 0.55, 0.45, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = interpolate(f, [0, 16], [0.6, 2.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });
  const ringOpacity = interpolate(f, [0, 16], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          opacity: dot,
          scale: interpolate(f, [-6, 0, 3], [0.6, 1, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.9)',
          opacity: f >= 0 ? ringOpacity : 0,
          scale: ring,
          zIndex: 20,
        }}
      />
    </>
  );
};

/** Liquid Glass card: translucent, blurred, with a bright hairline edge. */
export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; radius?: number }> = ({ style, children, radius = 36 }) => (
  <div
    style={{
      borderRadius: radius,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 100%)',
      border: '1.5px solid rgba(255,255,255,0.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 30px 60px rgba(0,0,0,0.45)',
      backdropFilter: 'blur(30px) saturate(160%)',
      WebkitBackdropFilter: 'blur(30px) saturate(160%)',
      fontFamily: FONT,
      color: C.label,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A floating glass callout with an icon, used around the phone for depth. */
export const Callout: React.FC<{ icon: IconName; color: string; title: string; value: string; style?: React.CSSProperties }> = ({
  icon,
  color,
  title,
  value,
  style,
}) => (
  <Glass style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 22, padding: '24px 34px 24px 24px', ...style }}>
    <div style={{ width: 72, height: 72, borderRadius: 22, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={42} color="#fff" weight={2.4} />
    </div>
    <div>
      <div style={{ fontSize: 30, color: C.secondary, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  </Glass>
);

/** Confetti-like burst of small squares and dots from a point. */
export const Burst: React.FC<{ at: number; x: number; y: number; count?: number; spread?: number; colors?: string[] }> = ({
  at,
  x,
  y,
  count = 28,
  spread = 420,
  colors = [C.mint, C.tint, C.green, '#FFFFFF', C.brand],
}) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < 0 || f > 40) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = random(`a${i}${at}`) * Math.PI * 2;
        const dist = spread * (0.35 + 0.65 * random(`d${i}${at}`));
        const p = interpolate(f, [0, 30], [0, 1], { extrapolateRight: 'clamp', easing: EASE_OUT });
        const gravity = f * f * 0.25;
        const s = 10 + 14 * random(`s${i}${at}`);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(angle) * dist * p - s / 2,
              top: y + Math.sin(angle) * dist * p + gravity - s / 2,
              width: s,
              height: random(`r${i}`) > 0.5 ? s : s * 0.45,
              borderRadius: random(`c${i}`) > 0.6 ? '50%' : 3,
              background: colors[i % colors.length],
              rotate: `${f * 12 * (random(`w${i}`) - 0.5)}deg`,
              opacity: interpolate(f, [22, 40], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}
          />
        );
      })}
    </>
  );
};

/** Liquid Glass tab bar floating over the bottom of an iOS screen (in points). */
export const TabBar: React.FC<{ active?: number }> = ({ active = 0 }) => {
  const tabs: [IconName, string][] = [
    ['house', 'Summary'],
    ['doc', 'Documents'],
    ['people', 'Clients'],
    ['gear', 'Settings'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 26,
        height: 64,
        borderRadius: 32,
        background: 'rgba(40,40,44,0.72)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 6px',
        zIndex: 4,
      }}
    >
      {tabs.map(([icon, label], i) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 14px',
            borderRadius: 26,
            background: i === active ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: i === active ? C.tint : C.label,
          }}
        >
          <Icon name={icon} size={22} weight={i === active ? 2.3 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  );
};
