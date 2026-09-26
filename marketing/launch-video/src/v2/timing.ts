// v2 is cut to scripts/make-music-v2.mjs: 100 BPM at 30 fps.
export const FPS = 30;
export const BEAT = 18;
export const BAR = 72;

export const SCENES_V2 = {
  hook: 2 * BAR,
  intro: BAR,
  create: 2 * BAR,
  contacts: 2 * BAR,
  sign: 2 * BAR,
  pay: 2 * BAR,
  paid: 2 * BAR,
  bento: 2 * BAR,
  night: BAR,
  finale: 3 * BAR,
} as const;

export type SceneV2 = keyof typeof SCENES_V2;

export const TOTAL_V2 = Object.values(SCENES_V2).reduce((a, b) => a + b, 0);

export const startV2 = (name: SceneV2): number => {
  let t = 0;
  for (const [key, len] of Object.entries(SCENES_V2)) {
    if (key === name) return t;
    t += len;
  }
  throw new Error(`Unknown scene ${name}`);
};
