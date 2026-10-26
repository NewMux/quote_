// "A short history of getting paid." — a 45 s narrated documentary-trailer reel for Instagram
// (9:16). The soundtrack is the owner's track "LETS GO" from 0:29 (public/track, kept out of Git):
// a 34 s build, then the drop. The narration (ElevenLabs, voice "Marcus – Powerful Motivational
// Narrator", eleven_v4, take A in public/vo/doc-voiceover.mp3) is cut line by line onto the
// track's beats so "INVOICE THEM!" lands on the drop.
export const FPS = 30;

/** The track runs at 129 BPM; its drop (the first kick of the chorus) is 34.25 s in. */
export const BPM = 129;
export const DROP = 34.25;
const P = 60 / BPM;
const beat = (n: number) => DROP + (n - 73) * P;
export const sec = (s: number) => Math.round(s * FPS);

export const TOTAL_DOC = sec(45);

/** Narration: each line's slot in the take (`from`/`to`, seconds) and where it plays (`at`). */
export type VoLine = { id: string; text: string; at: number; from: number; to: number };
const line = (id: string, text: string, from: number, to: number, at: number): VoLine => ({ id, text, from, to, at });

export const VO: VoLine[] = [
  line('hundred', 'For a hundred years…', 0.02, 1.62, 2.1),
  line('looked', 'getting paid looked like this.', 1.7, 3.8, 3.96),
  line('work', 'You did the work.', 4.02, 5.16, 6.28),
  line('down', 'You wrote it down.', 5.3, 6.58, 7.68),
  line('filed', 'You filed it away.', 6.58, 7.96, 9.07),
  line('waited', 'And then… you waited.', 7.96, 10.04, 10.93),
  line('called', 'You called.', 10.05, 11.16, 13.26),
  line('waited2', 'You waited.', 11.16, 12.2, 14.65),
  line('again', 'You called again.', 12.2, 13.5, 16.05),
  line('departments', 'Whole departments.', 13.52, 14.6, 17.45),
  line('careers', 'Whole careers.', 14.6, 15.78, 18.84),
  line('yours', 'Chasing money… that was already yours.', 15.78, 18.4, 20.24),
  line('year', 'It’s 2026.', 18.8, 20.6, beat(57) - 0.06),
  line('still', 'And you’re still waiting?', 20.6, 21.9, beat(61) - 0.06),
  line('anymore', 'Not anymore.', 22.26, 23.38, beat(65) - 0.06),
  line('clients', 'You have clients?', 23.38, 24.5, beat(69) - 0.06),
  // "INVOICE" starts 24.56 s into the take; it starts on the drop.
  line('invoice', 'INVOICE THEM!', 24.5, 25.6, DROP - 0.06),
  line('create', 'Create it.', 25.9, 26.44, beat(76) - 0.06),
  line('sign', 'Sign it.', 26.44, 27.08, beat(78) - 0.06),
  line('send', 'Send it.', 27.08, 27.66, beat(80) - 0.06),
  line('paid', 'Get paid.', 27.66, 28.66, beat(82) - 0.06),
  line('brand', 'Invoice Them.', 28.66, 29.72, beat(85) - 0.06),
  line('price', 'Your first month… ninety-nine cents.', 29.72, 32.0, beat(87) - 0.06),
];
export const vo = (id: string) => VO.find((l) => l.id === id)!;

type Source = 'troubles' | 'bookkeeping' | 'telephone' | 'money' | 'secretary';
export const SOURCES: Record<Source, string> = {
  troubles: '1925 · Troubles of a Merchant',
  bookkeeping: '1945 · Bookkeeping and Accounting',
  telephone: '1950 · The Town and the Telephone',
  money: '1947 · What Is Money?',
  secretary: '1947 · The Secretary’s Day',
};

export type DocShot =
  | { kind: 'title'; from: number; clip: string; trim?: number; source: Source }
  | { kind: 'film'; from: number; clip: string; trim?: number; source: Source; caption?: string; color?: boolean; focus?: string }
  | { kind: 'black'; from: number }
  | { kind: 'typed'; from: number }
  | { kind: 'anymore'; from: number }
  | { kind: 'question'; from: number }
  | { kind: 'answer'; from: number }
  | { kind: 'app'; from: number; step: number }
  | { kind: 'end'; from: number };

const film = (id: string, clip: string, source: Source, extra: Partial<Extract<DocShot, { kind: 'film' }>> = {}): DocShot => ({
  kind: 'film',
  from: sec(vo(id).at),
  clip,
  source,
  caption: vo(id).text,
  ...extra,
});

/** The flash montage between the last archive line and "It's 2026": a cut every half beat. */
const FLASH: [string, Source, boolean?][] = [
  ['acct', 'troubles'],
  ['hangup', 'telephone', true],
  ['tape', 'troubles'],
  ['counters', 'troubles'],
  ['writing', 'telephone', true],
  ['machine', 'troubles'],
  ['slip', 'troubles'],
  ['dial', 'telephone', true],
  ['cash', 'troubles'],
  ['adding', 'bookkeeping'],
  ['charge', 'troubles'],
  ['typing', 'secretary'],
  ['outstanding', 'troubles'],
  ['call', 'telephone', true],
];
const flashStart = vo('yours').at + (vo('yours').to - vo('yours').from) + 0.1;

export const DOC_SHOTS: DocShot[] = [
  { kind: 'title', from: 0, clip: 'charge', trim: 22, source: 'troubles' },
  film('hundred', 'counters', 'troubles', { trim: 20 }),
  film('looked', 'slip', 'troubles', { trim: 4 }),
  film('work', 'typing', 'secretary'),
  film('down', 'ledger', 'bookkeeping'),
  film('filed', 'outstanding', 'troubles', { trim: 10 }),
  film('waited', 'office', 'bookkeeping'),
  film('called', 'call', 'telephone', { color: true, focus: '40% 50%' }),
  film('waited2', 'adding', 'bookkeeping'),
  film('again', 'dial', 'telephone', { color: true, focus: '60% 50%' }),
  { kind: 'film', from: sec(vo('again').at + 0.75), clip: 'hangup', trim: 12, source: 'telephone', caption: vo('again').text, color: true },
  film('departments', 'office', 'bookkeeping', { trim: 120 }),
  film('careers', 'sign', 'bookkeeping', { trim: 160 }),
  film('yours', 'money', 'money'),
  ...FLASH.map(([clip, source, color], i): DocShot => ({ kind: 'film', from: sec(flashStart + i * (P / 2)), clip, source, color })),
  { kind: 'black', from: sec(flashStart + FLASH.length * (P / 2)) },
  { kind: 'typed', from: sec(vo('year').at - 0.1) },
  { kind: 'anymore', from: sec(vo('anymore').at - 0.05) },
  { kind: 'question', from: sec(vo('clients').at - 0.05) },
  { kind: 'answer', from: sec(DROP) },
  ...(['create', 'sign', 'send', 'paid'] as const).map((id, step): DocShot => ({ kind: 'app', from: sec(vo(id).at), step })),
  { kind: 'end', from: sec(vo('brand').at) },
];

export const shotLength = (i: number) => (i + 1 < DOC_SHOTS.length ? DOC_SHOTS[i + 1].from : TOTAL_DOC) - DOC_SHOTS[i].from;

/** Frames into the end card where "$0.99" lands, on "ninety-nine". */
export const DOC_PRICE_AT = sec(vo('price').at + 1.05 - vo('brand').at);
