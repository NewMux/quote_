// "You have clients? Invoice them." — a 20 s editorial fast-cut reel, cut to
// scripts/make-music-reel.mjs (120 BPM: one beat = 15 frames, half a beat = 7.5).
// 40 beats = 600 frames = 20 s. Every cut lands on a beat or half beat.
export const FPS = 30;
export const BEAT = 15;
export const TOTAL_REEL = 40 * BEAT;

export type ShotKind =
  | 'word'
  | 'client'
  | 'drop'
  | 'title'
  | 'create'
  | 'sign'
  | 'send'
  | 'paid'
  | 'total'
  | 'end';

export type Shot = { kind: ShotKind; from: number; len: number; i?: number };

/** The client roll: one file card per half beat. */
export const CLIENTS = [
  { name: 'Northwind Studio', job: 'Brand refresh', amount: '$4,290.00' },
  { name: 'Dr. Amara Patel', job: 'Kitchen remodel', amount: '$12,800.00' },
  { name: "Marco's Café", job: 'Espresso machine repair', amount: '$640.00' },
  { name: 'Lena & Josh', job: 'Wedding photography', amount: '$3,500.00' },
  { name: 'Harbor Dental', job: 'New website', amount: '$2,150.00' },
  { name: 'The Kim Residence', job: 'Lawn care · October', amount: '$180.00' },
  { name: 'Atlas Logistics', job: 'Ops consulting', amount: '$7,500.00' },
  { name: 'The Ortiz Family', job: 'Water heater install', amount: '$925.00' },
  { name: 'Studio Fern', job: 'Product shoot', amount: '$1,800.00' },
  { name: 'Bayside Gym', job: 'Monthly retainer', amount: '$600.00' },
] as const;

/** The headline words, set full-frame. */
export const WORDS = ['You', 'have', 'clients?', 'Invoice', 'them.'] as const;

const b = (beats: number) => Math.round(beats * BEAT);

export const SHOTS: Shot[] = [
  // 0–2 s: the question, one word per beat, "clients?" holds.
  { kind: 'word', i: 0, from: 0, len: b(1) },
  { kind: 'word', i: 1, from: b(1), len: b(1) },
  { kind: 'word', i: 2, from: b(2), len: b(2) },
  // 2–4.5 s: ten clients on half beats.
  ...CLIENTS.map((_, i) => ({ kind: 'client' as const, i, from: b(4 + i / 2), len: b(4 + (i + 1) / 2) - b(4 + i / 2) })),
  // 4.5–5 s: the music drops out. "Unpaid." on black.
  { kind: 'drop', from: b(9), len: b(1) },
  // 5–7 s: the answer.
  { kind: 'word', i: 3, from: b(10), len: b(1) },
  { kind: 'word', i: 4, from: b(11), len: b(3) },
  // 7–16 s: the product, a title card on each downbeat, then the app.
  { kind: 'title', i: 0, from: b(14), len: b(1) },
  { kind: 'create', from: b(15), len: b(4) },
  { kind: 'title', i: 1, from: b(19), len: b(1) },
  { kind: 'sign', from: b(20), len: b(3) },
  { kind: 'title', i: 2, from: b(23), len: b(1) },
  { kind: 'send', from: b(24), len: b(3) },
  { kind: 'title', i: 3, from: b(27), len: b(1) },
  { kind: 'paid', from: b(28), len: b(4) },
  // 16–17 s: the total.
  { kind: 'total', from: b(32), len: b(2) },
  // 17–20 s: end card.
  { kind: 'end', from: b(34), len: b(6) },
];

export const TITLES = ['Create.', 'Sign.', 'Send.', 'Get paid.'] as const;
