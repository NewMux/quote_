// The 15 s ad is cut to scripts/make-music-ad.mjs (100 BPM, one beat = 18 frames) and to the
// voiceover's lines. 24 beats = 432 frames = 14.4 s.
export const FPS = 30;
export const BEAT = 18;

export const SCENES_AD = {
  hook: 5 * BEAT,
  create: 4 * BEAT,
  sign: 4 * BEAT,
  pay: 4 * BEAT,
  finale: 7 * BEAT,
} as const;

export type SceneAd = keyof typeof SCENES_AD;

export const TOTAL_AD = Object.values(SCENES_AD).reduce((a, b) => a + b, 0);

export const startAd = (name: SceneAd): number => {
  let t = 0;
  for (const [key, len] of Object.entries(SCENES_AD)) {
    if (key === name) return t;
    t += len;
  }
  throw new Error(`Unknown scene ${name}`);
};

/**
 * public/vo/ad-voiceover.mp3 is one ElevenLabs take (voice "Justin Case", eleven_v4) of the
 * whole script. Each line is trimmed out of it at its pauses (frames into the take) and placed
 * `at` frames into its scene.
 */
export const VO: { scene: SceneAd; at: number; from: number; to: number; text: string }[] = [
  { scene: 'hook', at: 4, from: 0, to: 66, text: 'Still invoicing in spreadsheets?' },
  { scene: 'create', at: 4, from: 74, to: 131, text: 'Create an invoice in seconds.' },
  { scene: 'sign', at: 4, from: 133, to: 169, text: 'Get it signed on the spot.' },
  { scene: 'pay', at: 2, from: 176, to: 234, text: 'Your client scans… and pays.' },
  { scene: 'finale', at: 8, from: 241, to: 318, text: 'Invoice Them. Try it free on the App Store.' },
];
