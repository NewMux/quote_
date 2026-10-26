// Soundtrack for the 20 s "You have clients? Invoice them." reel: v2's instrument rack at
// 120 BPM in D minor (Dm9 · B♭maj7 · Fmaj7 · C6), 40 beats = 20 s, arranged to src/reel/timing.ts:
//   beats 0–3 the question: a sub hit on each word, no groove · 4–8.5 the client roll: four on the
//   floor, 16th shakers, a tick on every card · 9 the drop: silence and a reverse swell · 10 the
//   answer lands on a big hit · 14–31 the product: full groove with snaps · 32 the payoff: bells ·
//   34–39 end card: the home chord rings out.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS, bass, bell, kick, marimba, pad, shaker, snap, softHit, swell } from './instruments-v2.mjs';
import { SR, bus, normalize, pingPong, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 120;
const BEAT = 60 / BPM;
const BEATS = 40;
const DURATION = BEATS * BEAT;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);
const at = (beat) => beat * BEAT;
const PROGRESSION = [CHORDS[1], CHORDS[2], CHORDS[0], CHORDS[3]];
const chordAt = (beat) => PROGRESSION[Math.floor(beat / 4) % 4];

function song() {
  const drums = bus(TOTAL);
  const low = bus(TOTAL);
  const keys = bus(TOTAL);
  const pads = bus(TOTAL);
  const fx = bus(TOTAL);
  const send = bus(TOTAL);
  const sidechain = new Float32Array(TOTAL).fill(1);
  const duck = (t) => {
    const s = Math.round(t * SR);
    for (let n = 0; n < 0.25 * SR && s + n < TOTAL; n++) sidechain[s + n] *= 1 - 0.55 * Math.exp(-n / SR / 0.08);
  };
  const groove = (from, to, { snaps }) => {
    for (let beat = from; beat < to; beat++) {
      const t = at(beat);
      const chord = chordAt(beat);
      kick(drums, t, 1);
      duck(t);
      if (snaps && beat % 2 === 1) snap(drums, send, t, 0.75);
      for (let k = 0; k < 4; k++) shaker(drums, t + (k * BEAT) / 4, k % 2 ? 0.05 : 0.09);
      bass(low, t + BEAT / 2, chord.root * 2, BEAT * 0.42, 0.42);
      bass(low, t, chord.root, BEAT * 0.4, 0.3);
    }
  };

  // The question: "You" · "have" · "clients?" — a sub hit on each, a pad under it.
  pad(pads, send, 0, PROGRESSION[0].notes, at(4), 0.14, 900);
  [0, 1].forEach((beat) => {
    kick(drums, at(beat), 1);
    marimba(keys, send, at(beat), PROGRESSION[0].notes[beat + 1] * 2, 0.14);
  });
  softHit(fx, send, at(2), 0.7);
  kick(drums, at(2), 1);
  swell(fx, send, at(3), BEAT, 0.12);

  // The client roll: a high tick on every card (half beats).
  groove(4, 9, { snaps: false });
  for (let i = 0; i < 10; i++) {
    const chord = chordAt(4 + i / 2);
    marimba(keys, send, at(4 + i / 2), chord.notes[i % chord.notes.length] * 4, 0.09, i % 2 ? 0.4 : -0.4);
  }
  pad(pads, send, at(4), PROGRESSION[0].notes, at(5), 0.1, 1600);

  // The drop: nothing but a swell into the answer.
  swell(fx, send, at(9), BEAT, 0.22);

  // The answer: "Invoice" on a big hit, "them." on the next beat.
  softHit(fx, send, at(10), 0.9);
  kick(drums, at(10), 1.1);
  kick(drums, at(11), 1.1);
  softHit(fx, send, at(11), 0.6);
  pad(pads, send, at(10), [...PROGRESSION[2].notes, 440], at(4), 0.16, 2400);
  [0, 1, 2].forEach((k) => bell(keys, send, at(11) + k * 0.12, PROGRESSION[2].notes[k + 1] * 2, 0.06, k * 0.3 - 0.3));
  groove(12, 14, { snaps: false });
  swell(fx, send, at(13), BEAT, 0.14);

  // The product: full groove, chords every bar, a tick on each title card.
  groove(14, 32, { snaps: true });
  for (let bar = 0; bar < 5; bar++) {
    const beat = 12 + bar * 4;
    pad(pads, send, at(beat), chordAt(beat).notes, at(4) + 0.05, 0.1, 2200);
  }
  for (const beat of [14, 19, 23, 27]) {
    softHit(fx, send, at(beat), 0.35);
    marimba(keys, send, at(beat), chordAt(beat).notes[2] * 4, 0.1);
  }
  const motif = [0, 2, 1, 3];
  for (let e = 0; e < 36; e++) {
    const beat = 14 + e / 2;
    const chord = chordAt(beat);
    marimba(keys, send, at(beat), chord.notes[motif[e % 4] % chord.notes.length] * 2, 0.08, e % 2 ? 0.35 : -0.35);
  }
  swell(fx, send, at(30), at(2), 0.14);

  // The payoff.
  softHit(fx, send, at(32), 0.8);
  kick(drums, at(32), 1.1);
  [0, 0.5, 1, 1.5].forEach((b, i) => bell(keys, send, at(32 + b), PROGRESSION[2].notes[(i % 3) + 1] * 4, 0.06, i % 2 ? 0.3 : -0.3));
  pad(pads, send, at(32), PROGRESSION[2].notes, at(2), 0.14, 3000);

  // End card: the home chord rings out.
  softHit(fx, send, at(34), 0.7);
  kick(drums, at(34), 1);
  pad(pads, send, at(34), [...PROGRESSION[0].notes, 440], at(6), 0.2, 2600);
  bass(low, at(34), PROGRESSION[0].root * 2, 2.2, 0.4);
  [0, 1, 2, 3].forEach((i) => marimba(keys, send, at(34) + i * 0.09, PROGRESSION[0].notes[i] * 2, 0.11, i * 0.2 - 0.3));

  return mix(drums, low, keys, pads, fx, send, sidechain);
}

function mix(drums, low, keys, pads, fx, send, sidechain) {
  pingPong(keys, BEAT * 0.75, 0.25, 0.3);
  const wet = reverb(send, 0.86);
  const out = bus(TOTAL);
  for (let n = 0; n < TOTAL; n++) {
    const sc = sidechain[n];
    for (let ch = 0; ch < 2; ch++) {
      const v = drums[ch][n] * 0.85 + low[ch][n] * sc * 0.9 + keys[ch][n] * sc * 0.7 + pads[ch][n] * sc * 0.75 + fx[ch][n] * 0.75 + wet[ch][n] * 0.55;
      out[ch][n] = Math.tanh(v * 1.1);
    }
  }
  normalize(out, 0.9);
  const fadeStart = (DURATION - 1.2) * SR;
  for (let n = Math.floor(fadeStart); n < TOTAL; n++) {
    const g = Math.max(0, 1 - (n - fadeStart) / (1.2 * SR));
    out[0][n] *= g;
    out[1][n] *= g;
  }
  return out;
}

writeWav(path.join(OUT, 'music-reel.wav'), song());
