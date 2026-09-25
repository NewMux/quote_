// Everything is cut to the soundtrack (scripts/make-music.mjs): 120 BPM at 30 fps.
export const FPS = 30;
export const BEAT = 15;
export const BAR = 60;

/** Scene lengths in frames, in order. Each boundary falls on a bar or beat of the music. */
export const SCENES = {
  hook: 2 * BAR, // 0–4 s: filtered intro and build
  logo: BAR, // 4–6 s: the drop
  summary: 2 * BAR,
  create: 2 * BAR,
  sign: BAR,
  share: 2 * BAR,
  paid: BAR,
  montage: 2 * BAR, // 22–26 s: breakdown and build
  lockup: 3 * BAR, // 26–32 s: final drop and outro hit
} as const;

export const TOTAL_FRAMES = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const sceneStart = (name: keyof typeof SCENES): number => {
  let t = 0;
  for (const [key, len] of Object.entries(SCENES)) {
    if (key === name) return t;
    t += len;
  }
  throw new Error(`Unknown scene ${name}`);
};
