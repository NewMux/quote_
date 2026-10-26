// "You have clients? Invoice them." — a 20 s hype reel, cut to scripts/make-music-reel.mjs
// (120 BPM: one beat = 15 frames). 40 beats = 600 frames = 20 s. Every cut lands on a beat,
// half beat or quarter beat; the drop on "INVOICE" is beat 8.
export const FPS = 30;
export const BEAT = 15;
export const TOTAL_REEL = 40 * BEAT;

export type ShotKind = 'word' | 'client' | 'build' | 'kinetic' | 'title' | 'create' | 'sign' | 'send' | 'paid' | 'flip' | 'total' | 'tag' | 'end';

export type Shot = { kind: ShotKind; from: number; len: number; i?: number };

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

/** Sum of the client roll. */
export const TOTAL_OWED = 34385;

export const WORDS = ['YOU', 'HAVE', 'CLIENTS?', 'INVOICE', 'THEM.'] as const;
export const TITLES = ['CREATE.', 'SIGN.', 'SEND.', 'GET PAID.'] as const;
export const TAGS = ['BILL IT.', 'SEND IT.', 'GET PAID.', 'EVERY TIME.'] as const;

const b = (beats: number) => Math.round(beats * BEAT);
/** A run of `count` shots of `step` beats starting at beat `start`, on whole frames. */
const run = (kind: ShotKind, start: number, count: number, step: number, offset = 0): Shot[] =>
  Array.from({ length: count }, (_, k) => ({ kind, i: k + offset, from: b(start + k * step), len: b(start + (k + 1) * step) - b(start + k * step) }));

export const SHOTS: Shot[] = [
  // 0–1 s: the question.
  { kind: 'word', i: 0, from: b(0), len: b(0.5) },
  { kind: 'word', i: 1, from: b(0.5), len: b(1) - b(0.5) },
  { kind: 'word', i: 2, from: b(1), len: b(1) },
  // 1–3 s: the client roll accelerates: half beats, then quarter beats.
  ...run('client', 2, 4, 0.5),
  ...run('client', 4, 8, 0.25, 4),
  // 3–4 s: the build. What they owe you, still not invoiced.
  { kind: 'build', from: b(6), len: b(2) },
  // 4–6 s: the drop.
  { kind: 'word', i: 3, from: b(8), len: b(1) },
  { kind: 'word', i: 4, from: b(9), len: b(1) },
  { kind: 'kinetic', from: b(10), len: b(2) },
  // 6–13 s: the product. A half-beat title slam, then three beats of app with a punch-in per beat.
  ...(['create', 'sign', 'send', 'paid'] as const).flatMap((kind, k): Shot[] => [
    { kind: 'title', i: k, from: b(12 + k * 3.5), len: b(12.5 + k * 3.5) - b(12 + k * 3.5) },
    { kind, from: b(12.5 + k * 3.5), len: b(15.5 + k * 3.5) - b(12.5 + k * 3.5) },
  ]),
  // 13–15 s: every client flips to PAID, a cut every quarter beat.
  ...run('flip', 26, 16, 0.25),
  // 15–16 s: the total, collected.
  { kind: 'total', from: b(30), len: b(2) },
  // 16–17 s: the tagline, half beats.
  ...run('tag', 32, 4, 0.5),
  // 17–20 s: end card.
  { kind: 'end', from: b(34), len: b(6) },
];

/** Impacts: frame and strength. Drive the camera shake, zoom punch and chromatic split. */
export const HITS: { at: number; power: number }[] = [
  { at: b(0), power: 1 },
  { at: b(0.5), power: 0.7 },
  { at: b(1), power: 1 },
  ...Array.from({ length: 4 }, (_, k) => ({ at: b(2 + k * 0.5), power: 0.45 })),
  ...Array.from({ length: 8 }, (_, k) => ({ at: b(4 + k * 0.25), power: 0.35 })),
  ...Array.from({ length: 8 }, (_, k) => ({ at: b(6 + k * 0.25), power: 0.2 + k * 0.08 })),
  { at: b(8), power: 1.6 },
  { at: b(9), power: 1.2 },
  { at: b(10), power: 0.8 },
  { at: b(11), power: 0.6 },
  // Each step: the title slam, the app shot, then a punch-in on each of its next two beats.
  ...[0, 1, 2, 3].flatMap((k) => [
    { at: b(12 + k * 3.5), power: 1 },
    { at: b(12.5 + k * 3.5), power: 0.5 },
    { at: b(13.5 + k * 3.5), power: 0.6 },
    { at: b(14.5 + k * 3.5), power: 0.6 },
  ]),
  ...Array.from({ length: 16 }, (_, k) => ({ at: b(26 + k * 0.25), power: k % 4 === 0 ? 0.6 : 0.3 })),
  { at: b(30), power: 1.4 },
  ...Array.from({ length: 4 }, (_, k) => ({ at: b(32 + k * 0.5), power: 0.8 })),
  { at: b(34), power: 1.5 },
  { at: b(36), power: 0.5 },
];

/** One-frame color inversions on the biggest moments. */
export const STROBES = [b(1), b(7), b(7.5), b(7.75), b(8), b(9), b(30), b(34)];

/** Frames of total silence before the drop (the music's gap). */
export const GAP = { from: b(7.75), to: b(8) };
