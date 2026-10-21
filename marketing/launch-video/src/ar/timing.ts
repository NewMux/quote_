// The Arabic promo is cut to scripts/make-music-ar.mjs (100 BPM, one beat = 18 frames at 30 fps)
// and to the voiceover's word timings. Every spoken phrase starts a beat or two after a cut:
//   0.0 s  "I finished the job and the client said sure, I'll transfer it now"
//   5.4 s  "Two months and I'm still digging through WhatsApp"          (beat 9)
//   9.0 s  "Did I send him the invoice or not?"                          (beat 15)
//   10.8 s "Now I fill the blanks from my phone and get a PDF invoice"   (beat 18)
//   15.6 s "…and see at a glance who paid and who still owes"            (beat 26)
//   19.8 s "Invoice Them. Your money reaches you."                       (beat 33)
export const FPS = 30;
export const BEAT = 18;

export const SCENES_AR = {
  chat: 9 * BEAT,
  search: 6 * BEAT,
  noresult: 3 * BEAT,
  invoice: 8 * BEAT,
  glance: 7 * BEAT,
  finale: 7 * BEAT,
} as const;

export type SceneAr = keyof typeof SCENES_AR;

export const TOTAL_AR = Object.values(SCENES_AR).reduce((a, b) => a + b, 0);

export const startAr = (name: SceneAr): number => {
  let t = 0;
  for (const [key, len] of Object.entries(SCENES_AR)) {
    if (key === name) return t;
    t += len;
  }
  throw new Error(`Unknown scene ${name}`);
};

/** public/vo/ar-voiceover.mp3 plays once from frame 0 (22.5 s); the last 1.5 s is the end card. */
export const VOICEOVER = 'vo/ar-voiceover.mp3';

/** A spoken word: `at` is its onset in seconds into the voiceover (ElevenLabs Scribe). A `*` prefix
 * marks a keyword, which takes the scene's accent color; `+` is green (paid), `!` orange (owed). */
export type Word = { text: string; at: number };

/** The on-screen lines of each scene, one `Word[]` per line, in reading order (right to left). */
export const CAPTIONS: Record<Exclude<SceneAr, 'finale'>, Word[][]> = {
  chat: [
    [
      { text: 'خلصت', at: 0.3 },
      { text: 'الشغل', at: 0.84 },
    ],
    [
      { text: 'والعميل', at: 1.9 },
      { text: 'قال', at: 2.38 },
      { text: '*أبشر', at: 2.94 },
    ],
    [
      { text: 'الحين', at: 3.6 },
      { text: 'أحولك', at: 3.96 },
    ],
  ],
  search: [
    [
      { text: 'من', at: 5.58 },
      { text: '*شهرين', at: 5.76 },
    ],
    [
      { text: 'وأنا', at: 7.0 },
      { text: 'للحين', at: 7.24 },
      { text: 'أدور', at: 7.66 },
    ],
    [
      { text: 'في', at: 8.02 },
      { text: 'الـ', at: 8.06 },
      { text: '*WhatsApp', at: 8.16 },
    ],
  ],
  noresult: [
    [
      { text: 'أرسلت', at: 9.1 },
      { text: 'له', at: 9.48 },
    ],
    [
      { text: 'الفاتورة', at: 9.54 },
      { text: 'ولا', at: 10.06 },
      { text: '*لا؟', at: 10.3 },
    ],
  ],
  invoice: [
    [
      { text: 'الحين', at: 10.92 },
      { text: 'أعبي', at: 11.72 },
      { text: '*الفراغات', at: 12.08 },
    ],
    [
      { text: 'من', at: 12.6 },
      { text: 'جوالي', at: 12.76 },
    ],
    [
      { text: 'وتطلع', at: 13.5 },
      { text: 'لي', at: 13.96 },
      { text: 'فاتورة', at: 14.1 },
      { text: '*PDF', at: 14.6 },
      { text: 'باسمي', at: 15.14 },
    ],
  ],
  glance: [
    [
      { text: 'وأشوف', at: 15.88 },
      { text: 'بنظرة', at: 16.4 },
      { text: '*واحدة', at: 16.82 },
    ],
    [
      { text: 'مين', at: 17.5 },
      { text: '+دفع', at: 17.72 },
      { text: 'ومين', at: 18.44 },
      { text: '!باقي', at: 18.76 },
      { text: 'عليه', at: 19.1 },
    ],
  ],
};

/** Seconds into the voiceover → frames into the scene. */
export const inScene = (scene: SceneAr, seconds: number) => Math.round(seconds * FPS) - startAr(scene);

/** Finale cues, in seconds into the voiceover. */
export const FINALE = {
  invoice: 19.8,
  them: 20.32,
  money: 20.96,
  reaches: 21.68,
};
