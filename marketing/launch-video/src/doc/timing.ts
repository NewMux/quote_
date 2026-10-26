// "A short history of getting paid." — a 40 s editorial documentary reel for Instagram (9:16).
// Archival film (Prelinger Archives, public domain) in three dated chapters, then the turn to the
// app. scripts/make-music-doc.mjs reads the same cue points (DOC_CUES), in seconds.
export const FPS = 30;

export type DocShot =
  | { kind: 'quote'; len: number }
  | { kind: 'film'; len: number; clip: string; trim?: number; chapter?: { numeral: string; year: string; title: string }; caption: string; source: string; color?: boolean }
  | { kind: 'now'; len: number }
  | { kind: 'question'; len: number }
  | { kind: 'answer'; len: number }
  | { kind: 'app'; len: number; step: number }
  | { kind: 'end'; len: number };

const TROUBLES = 'Troubles of a Merchant, 1925';
const BOOKKEEPING = 'Bookkeeping and Accounting, 1945';
const TELEPHONE = 'The Town and the Telephone, 1950';

export const DOC_SHOTS: DocShot[] = [
  { kind: 'quote', len: 105 },
  // I. 1925 — the counter.
  { kind: 'film', len: 72, clip: 'cash', chapter: { numeral: 'I', year: '1925', title: 'The counter' }, caption: 'The money came in at the counter.', source: TROUBLES },
  { kind: 'film', len: 69, clip: 'charge', caption: 'Unless it didn’t.', source: TROUBLES },
  { kind: 'film', len: 90, clip: 'slip', caption: 'Then it went “on account.”', source: TROUBLES },
  { kind: 'film', len: 75, clip: 'outstanding', caption: 'Into a drawer marked “outstanding.”', source: TROUBLES },
  // II. 1945 — the ledger.
  { kind: 'film', len: 81, clip: 'office', chapter: { numeral: 'II', year: '1945', title: 'The ledger' }, caption: 'Whole departments worked on getting paid.', source: BOOKKEEPING },
  { kind: 'film', len: 60, clip: 'ledger', caption: 'Every sale, written down by hand.', source: BOOKKEEPING },
  { kind: 'film', len: 72, clip: 'sign', trim: 162, caption: 'Checked. Signed. Filed.', source: BOOKKEEPING },
  // III. 1950s — the follow-up.
  { kind: 'film', len: 72, clip: 'call', chapter: { numeral: 'III', year: '1950s', title: 'The follow-up' }, caption: 'Then came the follow-up call.', source: TELEPHONE, color: true },
  { kind: 'film', len: 63, clip: 'writing', caption: 'And the one after that.', source: TELEPHONE, color: true },
  // Today.
  { kind: 'now', len: 84 },
  { kind: 'question', len: 45 },
  { kind: 'answer', len: 60 },
  ...[0, 1, 2, 3].map((step) => ({ kind: 'app' as const, len: 36, step })),
  { kind: 'end', len: 120 },
];

export const DOC_STARTS = DOC_SHOTS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + DOC_SHOTS[i - 1].len], []);
export const TOTAL_DOC = DOC_STARTS[DOC_STARTS.length - 1] + DOC_SHOTS[DOC_SHOTS.length - 1].len;

/** Frames into the end card where the price comes in. */
export const DOC_PRICE_AT = 45;
