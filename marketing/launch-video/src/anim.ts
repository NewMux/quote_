import { Easing, interpolate } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Smooth, Apple-like ease out. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const SPRING = Easing.spring({ damping: 14, stiffness: 160, mass: 0.8 });
export const SPRING_SOFT = Easing.spring({ damping: 200 });

/** 0 → 1 between two frames with an easing, clamped. */
export const progress = (frame: number, start: number, end: number, easing = EASE_OUT) =>
  interpolate(frame, [start, end], [0, 1], { ...CLAMP, easing });

export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

export const clampInterp = (frame: number, input: number[], output: number[], easing = EASE_OUT) =>
  interpolate(frame, input, output, { ...CLAMP, easing });

/** Whip-pan exit: during the last `len` frames of a scene, content accelerates away with blur, so
 * the hard cut on the beat reads as a camera whip. */
export const whipOut = (frame: number, duration: number, len = 8) => {
  const p = interpolate(frame, [duration - len, duration], [0, 1], { ...CLAMP, easing: EASE_IN });
  return { p, blur: p * 36 };
};

/** Whip-pan entrance: the mirror of whipOut over the first `len` frames. */
export const whipIn = (frame: number, len = 8) => {
  const p = 1 - interpolate(frame, [0, len], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return { p, blur: p * 36 };
};

export const money = (value: number) =>
  '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
