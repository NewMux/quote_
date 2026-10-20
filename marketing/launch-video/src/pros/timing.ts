// "What separates the pros": a motivational-edit style spot. 30 fps, 20 s, cut to the
// voiceover (public/pros/voiceover.mp3: ElevenLabs, voice "Marcus", eleven_v4).
export const FPS = 30;
export const TOTAL = 600;

/** The voiceover starts this many frames in. */
export const VO_AT = 12;

/**
 * Every spoken word with its onset in the voiceover, in seconds (Whisper word timestamps,
 * corrected against the take's pauses). `big` words are set huge; the rest sit small above them.
 * A `/` starts a new subtitle card.
 */
const SCRIPT: [string, number, boolean?][] = [
  ['What', 0.0],
  ['separates', 0.26],
  ['the', 0.78],
  ['pros', 1.08, true],
  ['/from', 2.13],
  ['the', 2.24],
  ['average?', 2.4, true],
  ['/It’s', 3.63],
  ['not', 3.76],
  ['talent.', 3.94, true],
  ['/it’s', 5.04],
  ['presentation.', 5.22, true],
  ['/The', 6.59],
  ['average', 6.7, true],
  ['/send', 7.1],
  ['invoices', 7.36, true],
  ['/that', 7.92],
  ['look', 8.12],
  ['like', 8.3],
  ['an', 8.46],
  ['afterthought.', 8.58, true],
  ['/The', 9.74],
  ['pros,', 9.84, true],
  ['/they', 10.75],
  ['send', 10.86],
  ['estimates', 11.08, true],
  ['/and', 11.52],
  ['invoices', 11.74, true],
  ['/that', 12.24],
  ['look', 12.48],
  ['the', 12.74, true],
  ['part.', 12.94, true],
  ['/And', 13.66],
  ['clients', 13.74],
  ['notice.', 14.02, true],
  ['/Be', 15.19],
  ['the', 15.3],
  ['pro.', 15.46, true],
];

/** "Invoice Them." is spoken over the end card, where the wordmark itself appears. */
export const END_WORDS = { invoice: VO_AT + Math.round(16.48 * FPS), them: VO_AT + Math.round(16.76 * FPS) };

export type Word = { text: string; at: number; big: boolean };
export type Card = { words: Word[]; from: number; to: number };

export const CARDS: Card[] = (() => {
  const cards: Word[][] = [];
  for (const [raw, t, big] of SCRIPT) {
    const word = { text: raw.replace(/^\//, ''), at: VO_AT + Math.round(t * FPS), big: !!big };
    if (raw.startsWith('/') || cards.length === 0) cards.push([word]);
    else cards[cards.length - 1].push(word);
  }
  return cards.map((words, i) => ({
    words,
    from: words[0].at,
    // A card holds until the next one starts (or until the end card for the last one).
    to: i + 1 < cards.length ? cards[i + 1][0].at : END_WORDS.invoice - 2,
  }));
})();

export type Shot =
  | { kind: 'clip'; src: string; len: number; rate?: number; zoom?: [number, number]; grade?: 'cold' | 'warm' | 'film' | 'mono' }
  | { kind: 'graphic'; name: 'text' | 'sloppy' | 'estimate' | 'invoice'; len: number };

/**
 * The cut. `film-*` clips are from the Ocean's reference edit, the rest are Mixkit stock (see
 * scripts/prep-pros-footage.sh). `rate` below 1 is slow motion.
 */
export const SHOTS: Shot[] = [
  { kind: 'clip', src: 'film-tux', len: 24, rate: 0.66, zoom: [1.04, 1.1], grade: 'film' }, // What separates
  { kind: 'clip', src: 'film-lean', len: 30, zoom: [1.0, 1.06], grade: 'film' }, // the pros
  { kind: 'clip', src: 'stressed-desk', len: 27, grade: 'cold' }, // from the
  { kind: 'clip', src: 'overwhelmed', len: 37, zoom: [1.08, 1.0], grade: 'cold' }, // average?
  { kind: 'clip', src: 'film-dice', len: 24, grade: 'film' }, // It's not talent
  { kind: 'clip', src: 'film-hand', len: 17, grade: 'film' },
  { kind: 'clip', src: 'watch-on', len: 30, grade: 'warm' }, // it's presentation
  { kind: 'clip', src: 'watch-bw', len: 19, grade: 'mono' },
  { kind: 'clip', src: 'paperwork-thrown', len: 24, grade: 'cold' }, // The average send
  { kind: 'graphic', name: 'text', len: 36 }, // invoices that look like
  { kind: 'graphic', name: 'sloppy', len: 30 }, // an afterthought
  { kind: 'clip', src: 'film-jet', len: 30, rate: 0.5, zoom: [1.0, 1.08], grade: 'film' }, // The pros
  { kind: 'graphic', name: 'estimate', len: 30 }, // they send estimates
  { kind: 'graphic', name: 'invoice', len: 21 }, // and invoices
  { kind: 'clip', src: 'suit-street', len: 42, rate: 0.75, zoom: [1.0, 1.1], grade: 'warm' }, // that look the part
  { kind: 'clip', src: 'handshake', len: 26, grade: 'warm' }, // And clients notice
  { kind: 'clip', src: 'film-drink', len: 16, grade: 'film' },
  { kind: 'clip', src: 'film-car', len: 30, rate: 0.5, zoom: [1.0, 1.06], grade: 'film' }, // Be the pro
  { kind: 'clip', src: 'city-night', len: 14, grade: 'cold' },
];

export const END_AT = SHOTS.reduce((t, s) => t + s.len, 0);

const SHOT_STARTS = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((t, s) => t + s.len, 0));

/** Graphic shots keep their content on the left half of the band; a card that mostly plays over
 * one moves into the right-hand column so it never sits on top of a white page. */
export const cardSide = (card: Card): 'center' | 'right' => {
  let graphic = 0;
  SHOTS.forEach((shot, i) => {
    if (shot.kind !== 'graphic') return;
    const a = Math.max(card.from, SHOT_STARTS[i]);
    const b = Math.min(card.to, SHOT_STARTS[i] + shot.len);
    graphic += Math.max(0, b - a);
  });
  return graphic * 2 > card.to - card.from ? 'right' : 'center';
};
