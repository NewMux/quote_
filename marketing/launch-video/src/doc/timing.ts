// "A short history of getting paid." — a 19 s documentary-trailer reel for Instagram (9:16), cut to
// scripts/make-music-doc.mjs (120 BPM: one beat = 15 frames). Full-frame archival film (Prelinger
// Archives, public domain) cut faster and faster, two beats of silence, then the app.
export const FPS = 30;
export const BEAT = 15;

type Source = 'troubles' | 'bookkeeping' | 'telephone' | 'money' | 'secretary';

export type DocShot =
  | { kind: 'film'; len: number; clip: string; source: Source; trim?: number; line?: string; word?: string; flash?: boolean; focus?: string; color?: boolean }
  | { kind: 'gap'; len: number }
  | { kind: 'typed'; len: number }
  | { kind: 'question'; len: number }
  | { kind: 'answer'; len: number }
  | { kind: 'app'; len: number; step: number }
  | { kind: 'end'; len: number };

export const SOURCES: Record<Source, string> = {
  troubles: '1925 · Troubles of a Merchant',
  bookkeeping: '1945 · Bookkeeping and Accounting',
  telephone: '1950 · The Town and the Telephone',
  money: '1947 · What Is Money?',
  secretary: '1947 · The Secretary’s Day',
};

const b = (beats: number) => Math.round(beats * BEAT);

export const DOC_SHOTS: DocShot[] = [
  // 0–3 s: the hook, a line per two beats.
  { kind: 'film', len: b(2), clip: 'charge', trim: 22, source: 'troubles', line: 'For a hundred years,' },
  { kind: 'film', len: b(2), clip: 'slip', trim: 4, source: 'troubles', line: 'getting paid' },
  { kind: 'film', len: b(2), clip: 'counters', trim: 20, source: 'troubles', line: 'looked like this.' },
  // 3–6 s: a word per beat…
  { kind: 'film', len: b(1), clip: 'typing', source: 'secretary', word: 'Write it.', flash: true },
  { kind: 'film', len: b(1), clip: 'outstanding', trim: 20, source: 'troubles', word: 'File it.', flash: true },
  { kind: 'film', len: b(1), clip: 'call', source: 'telephone', word: 'Chase it.', flash: true, color: true, focus: '40% 50%' },
  { kind: 'film', len: b(1), clip: 'office', source: 'bookkeeping', word: 'Wait.', flash: true },
  // …then a word per half beat…
  { kind: 'film', len: b(0.5), clip: 'hangup', trim: 10, source: 'telephone', word: 'Call.', color: true },
  { kind: 'film', len: b(1) - b(0.5), clip: 'ledger', source: 'bookkeeping', word: 'Wait.' },
  { kind: 'film', len: b(1.5) - b(1), clip: 'dial', source: 'telephone', word: 'Call.', color: true, focus: '60% 50%' },
  { kind: 'film', len: b(2) - b(1.5), clip: 'adding', source: 'bookkeeping', word: 'Wait.' },
  // …then four frames a shot, no words.
  { kind: 'film', len: 4, clip: 'acct', source: 'troubles' },
  { kind: 'film', len: 4, clip: 'money', source: 'money' },
  { kind: 'film', len: 4, clip: 'writing', source: 'telephone', color: true },
  { kind: 'film', len: 3, clip: 'machine', source: 'troubles' },
  // 6.5–7.5 s: silence.
  { kind: 'gap', len: b(2) },
  // 7.5–9 s: "It's 2026."
  { kind: 'typed', len: b(3) },
  // 9–11.5 s: the turn.
  { kind: 'question', len: b(2) },
  { kind: 'answer', len: b(3) },
  // 11.5–15.5 s: the app, two beats a step.
  ...[0, 1, 2, 3].map((step) => ({ kind: 'app' as const, len: b(2), step })),
  // 15.5–19 s: end card.
  { kind: 'end', len: b(7) },
];

export const DOC_STARTS = DOC_SHOTS.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + DOC_SHOTS[i - 1].len], []);
export const TOTAL_DOC = DOC_STARTS[DOC_STARTS.length - 1] + DOC_SHOTS[DOC_SHOTS.length - 1].len;

/** Frames into the end card where the price slams in. */
export const DOC_PRICE_AT = b(2);
