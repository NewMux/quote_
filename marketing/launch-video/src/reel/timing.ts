// "You have clients? Invoice them." — a 20 s editorial reel, cut to scripts/make-music-reel.mjs
// (120 BPM: one beat = 15 frames). 40 beats = 600 frames = 20 s. Hard cuts on the beat, and
// every shot holds at least one beat (0.5 s) so it can be read.
export const FPS = 30;
export const BEAT = 15;
export const TOTAL_REEL = 40 * BEAT;

export type ShotKind = 'word' | 'client' | 'owed' | 'pause' | 'title' | 'create' | 'sign' | 'send' | 'paid' | 'collected' | 'end';

export type Shot = { kind: ShotKind; from: number; len: number; i?: number };

export const CLIENTS = [
  { name: 'Northwind Studio', job: 'Brand refresh', amount: '$4,290' },
  { name: 'Dr. Amara Patel', job: 'Kitchen remodel', amount: '$12,800' },
  { name: 'Lena & Josh', job: 'Wedding photography', amount: '$3,500' },
  { name: 'Atlas Logistics', job: 'Ops consulting', amount: '$7,500' },
  { name: 'Harbor Dental', job: 'New website', amount: '$6,295' },
] as const;

/** Sum of the client roll. */
export const TOTAL_OWED = 34385;

export const WORDS = ['You', 'have', 'clients?', 'Invoice', 'them.'] as const;
export const TITLES = ['Create', 'Sign', 'Send', 'Get paid'] as const;

const b = (beats: number) => beats * BEAT;

export const SHOTS: Shot[] = [
  // 0–2 s: the question. One word per beat; "clients?" holds two.
  { kind: 'word', i: 0, from: b(0), len: b(1) },
  { kind: 'word', i: 1, from: b(1), len: b(1) },
  { kind: 'word', i: 2, from: b(2), len: b(2) },
  // 2–4.5 s: five clients, one per beat.
  ...CLIENTS.map((_, i) => ({ kind: 'client' as const, i, from: b(4 + i), len: b(1) })),
  // 4.5–5.5 s: what that adds up to.
  { kind: 'owed', from: b(9), len: b(2) },
  // 5.5–6 s: the music stops for a beat.
  { kind: 'pause', from: b(11), len: b(1) },
  // 6–7.5 s: the answer.
  { kind: 'word', i: 3, from: b(12), len: b(1) },
  { kind: 'word', i: 4, from: b(13), len: b(2) },
  // 7.5–15.5 s: four steps. A numbered title for a beat, then three beats of the app.
  ...(['create', 'sign', 'send', 'paid'] as const).flatMap((kind, k): Shot[] => [
    { kind: 'title', i: k, from: b(15 + k * 4), len: b(1) },
    { kind, from: b(16 + k * 4), len: b(3) },
  ]),
  // 15.5–17 s: collected.
  { kind: 'collected', from: b(31), len: b(3) },
  // 17–20 s: end card.
  { kind: 'end', from: b(34), len: b(6) },
];

/** Frames into the end card where the price comes in (beat 36). */
export const PRICE_AT = b(2);
