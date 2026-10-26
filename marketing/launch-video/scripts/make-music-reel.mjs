// Soundtrack for the 20 s "You have clients? Invoice them." editorial reel: v2's instrument rack at
// 90 BPM (Dm9 · B♭maj7 · Fmaj7 · C6), 30 beats = 20 s, arranged to src/reel/timing.ts:
//   0–4 the question: a low hit and a marimba note on each word · 5–9 the client roll and the
//   total: a light groove, a tick on every card · 10 the pause: silence · 11–13 the answer, a hit
//   per line · 14–25 the steps: full groove, a hit on each step · 24 collected: bells · 26 end card:
//   the home chord rings out, a chime under the price.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS, bass, bell, kick, marimba, pad, shaker, snap, softHit, swell } from './instruments-v2.mjs';
import { SR, bus, normalize, pingPong, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 90;
const BEAT = 60 / BPM;
const BEATS = 30;
const DURATION = BEATS * BEAT;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);
const at = (beat) => beat * BEAT;
const PROG = [CHORDS[1], CHORDS[2], CHORDS[0], CHORDS[3]];
const chordAt = (beat) => PROG[Math.floor(beat / 4) % 4];

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
    for (let n = 0; n < 0.3 * SR && s + n < TOTAL; n++) sidechain[s + n] *= 1 - 0.35 * Math.exp(-n / SR / 0.1);
  };
  const groove = (from, to, { snaps = true } = {}) => {
    for (let beat = Math.ceil(from); beat < to; beat++) {
      const t = at(beat);
      const chord = chordAt(beat);
      kick(drums, t, beat % 2 === 0 ? 0.95 : 0.7);
      duck(t);
      if (snaps && beat % 2 === 1) snap(drums, send, t, 0.55);
      for (let k = 0; k < 4; k++) shaker(drums, t + (k * BEAT) / 4, k % 2 ? 0.03 : 0.06);
      bass(low, t, chord.root, BEAT * 0.45, 0.32);
      bass(low, t + BEAT / 2, chord.root * 2, BEAT * 0.4, 0.3);
    }
  };
  const tick = (t, f) => marimba(keys, send, t, f, 0.08, 0);

  // The question: "You" · "have" · "clients?".
  pad(pads, send, 0, PROG[0].notes, at(5), 0.12, 900);
  [0, 1].forEach((beat) => {
    kick(drums, at(beat), 0.9);
    marimba(keys, send, at(beat), PROG[0].notes[beat + 1] * 2, 0.13);
  });
  softHit(fx, send, at(2), 0.6);
  kick(drums, at(2), 0.95);
  [0, 1, 2].forEach((k) => marimba(keys, send, at(2) + k * 0.1, PROG[0].notes[k + 1] * 2, 0.1, k * 0.3 - 0.3));
  swell(fx, send, at(4), BEAT, 0.1);

  // The client roll and the total.
  groove(5, 10, { snaps: false });
  for (let i = 0; i < 3; i++) tick(at(5 + i), chordAt(5 + i).notes[i % 3] * 4);
  pad(pads, send, at(5), PROG[1].notes, at(3), 0.09, 1500);
  pad(pads, send, at(8), PROG[2].notes, at(2), 0.1, 1800);
  softHit(fx, send, at(8), 0.4);

  // The pause: nothing. The answer lands after it, a hit per line.
  softHit(fx, send, at(11), 0.8);
  kick(drums, at(11), 1);
  pad(pads, send, at(11), [...PROG[3].notes, 440], at(3), 0.14, 2400);
  kick(drums, at(12), 1);
  softHit(fx, send, at(12), 0.5);
  [0, 1, 2].forEach((k) => bell(keys, send, at(13) + k * 0.14, PROG[0].notes[k + 1] * 2, 0.06, k * 0.3 - 0.3));
  groove(13, 14);

  // The steps: full groove, a marimba line, a hit on each step.
  groove(14, 26);
  for (let bar = 0; bar < 3; bar++) pad(pads, send, at(14 + bar * 4), chordAt(16 + bar * 4).notes, at(4) + 0.05, 0.09, 2200);
  for (const beat of [14, 16.5, 19, 21.5]) {
    softHit(fx, send, at(beat), 0.35);
    tick(at(beat), chordAt(beat + 2).notes[2] * 4);
  }
  const motif = [0, 2, 1, 3];
  for (let e = 0; e < 20; e++) {
    const beat = 14 + e / 2;
    const chord = chordAt(beat + 2);
    marimba(keys, send, at(beat), chord.notes[motif[e % 4] % chord.notes.length] * 2, 0.07, e % 2 ? 0.35 : -0.35);
  }
  swell(fx, send, at(23), BEAT, 0.1);

  // Collected.
  softHit(fx, send, at(24), 0.6);
  [0, 0.5, 1, 1.5].forEach((b, i) => bell(keys, send, at(24 + b), PROG[2].notes[(i % 3) + 1] * 4, 0.05, i % 2 ? 0.3 : -0.3));
  swell(fx, send, at(25), BEAT, 0.1);

  // End card: the home chord rings out; a chime under the price.
  softHit(fx, send, at(26), 0.7);
  kick(drums, at(26), 0.9);
  pad(pads, send, at(26), [...PROG[0].notes, 440], at(4), 0.18, 2600);
  bass(low, at(26), PROG[0].root * 2, 2.4, 0.36);
  [0, 1, 2, 3].forEach((i) => marimba(keys, send, at(26) + i * 0.1, PROG[0].notes[i] * 2, 0.1, i * 0.2 - 0.3));
  [0, 1, 2].forEach((k) => bell(keys, send, at(27.5) + k * 0.12, PROG[0].notes[k + 1] * 4, 0.05, k * 0.3 - 0.3));

  return mix(drums, low, keys, pads, fx, send, sidechain);
}

function mix(drums, low, keys, pads, fx, send, sidechain) {
  pingPong(keys, BEAT * 0.75, 0.25, 0.3);
  const wet = reverb(send, 0.86);
  const out = bus(TOTAL);
  for (let n = 0; n < TOTAL; n++) {
    const sc = sidechain[n];
    for (let ch = 0; ch < 2; ch++) {
      const v = drums[ch][n] * 0.85 + low[ch][n] * sc * 0.9 + keys[ch][n] * sc * 0.75 + pads[ch][n] * sc * 0.75 + fx[ch][n] * 0.7 + wet[ch][n] * 0.5;
      out[ch][n] = Math.tanh(v * 1.05);
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
