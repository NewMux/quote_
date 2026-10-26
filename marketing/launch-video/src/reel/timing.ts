// "You have clients? Invoice them." — a 20 s editorial reel, cut to scripts/make-music-reel.mjs
// (90 BPM: one beat = 20 frames). 30 beats = 600 frames = 20 s. Hard cuts on the beat; the
// shortest shot holds one beat (0.67 s).
export const FPS = 30;
export const BEAT = 20;
export const TOTAL_REEL = 30 * BEAT;

export type ShotKind = 'word' | 'client' | 'owed' | 'pause' | 'answer' | 'create' | 'sign' | 'send' | 'paid' | 'collected' | 'end';

export type Shot = { kind: ShotKind; from: number; len: number; i?: number };

export const CLIENTS = [
  { name: 'Northwind Studio', job: 'Brand refresh', amount: '$4,290' },
  { name: 'Dr. Amara Patel', job: 'Kitchen remodel', amount: '$12,800' },
  { name: 'Atlas Logistics', job: 'Ops consulting', amount: '$7,500' },
] as const;

/** Sum of the client roll. */
export const TOTAL_OWED = 24590;

export const WORDS = ['You', 'have', 'clients?'] as const;
export const STEPS = ['Create', 'Sign', 'Send', 'Get paid'] as const;

const b = (beats: number) => beats * BEAT;

export const SHOTS: Shot[] = [
  // 0–3.3 s: the question. "You" and "have" a beat each; "clients?" holds three.
  { kind: 'word', i: 0, from: b(0), len: b(1) },
  { kind: 'word', i: 1, from: b(1), len: b(1) },
  { kind: 'word', i: 2, from: b(2), len: b(3) },
  // 3.3–5.3 s: three clients, a beat each.
  ...CLIENTS.map((_, i) => ({ kind: 'client' as const, i, from: b(5 + i), len: b(1) })),
  // 5.3–6.7 s: what that adds up to.
  { kind: 'owed', from: b(8), len: b(2) },
  // 6.7–7.3 s: the music stops for a beat.
  { kind: 'pause', from: b(10), len: b(1) },
  // 7.3–9.3 s: the answer, a line per beat.
  { kind: 'answer', from: b(11), len: b(3) },
  // 9.3–16 s: four steps in the app, two and a half beats each.
  { kind: 'create', i: 0, from: b(14), len: b(2.5) },
  { kind: 'sign', i: 1, from: b(16.5), len: b(2.5) },
  { kind: 'send', i: 2, from: b(19), len: b(2.5) },
  { kind: 'paid', i: 3, from: b(21.5), len: b(2.5) },
  // 16–17.3 s: collected.
  { kind: 'collected', from: b(24), len: b(2) },
  // 17.3–20 s: end card.
  { kind: 'end', from: b(26), len: b(4) },
];

/** Frames into the end card where the price comes in. */
export const PRICE_AT = b(1.5);

/** Frames into a product shot where it cuts to the closer angle. */
export const CLOSE_AT = b(1.5);
