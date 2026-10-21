// Soundtrack for the Arabic promo (src/ar): v2's instruments and key (100 BPM, F major), 40 beats
// = 24 s, in four sections that follow the story and land on its cuts (src/ar/timing.ts):
//   beats 0–9   the client's promise    soft pad + marimba, no drums
//   beats 9–18  digging through chats   a ticking pulse in the minor chord, a riser into the drop
//   beats 18–33 the app solves it       full groove: kick, snap, shaker, bass, marimba
//   beats 33–40 "Invoice Them"          bells over the groove, then the home chord rings out
// It sits under a voiceover that runs almost to the end, so it is sparse.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS, bass, bell, kick, marimba, pad, shaker, snap, softHit, swell } from './instruments-v2.mjs';
import { SR, bus, normalize, pingPong, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 100;
const BEAT = 60 / BPM;
const BEATS = 40;
const DURATION = BEATS * BEAT;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);

// Section starts and ends, in beats.
const SECTIONS = [
  { name: 'promise', from: 0, to: 9, first: 0 },
  { name: 'search', from: 9, to: 18, first: 1 },
  { name: 'groove', from: 18, to: 33, first: 2 },
  { name: 'finale', from: 33, to: 37, first: 0 },
];

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
    for (let n = 0; n < 0.3 * SR && s + n < TOTAL; n++) sidechain[s + n] *= 1 - 0.45 * Math.exp(-n / SR / 0.1);
  };
  const motif = [0, 2, 1, 3, 2, 1, 3, 2];

  for (const sec of SECTIONS) {
    const { name } = sec;
    for (let b = sec.from; b < sec.to; b++) {
      const rel = b - sec.from;
      const chord = CHORDS[(sec.first + Math.floor(rel / 4)) % 4];
      const t = b * BEAT;
      const barStart = rel % 4 === 0;

      // Pad: one per bar, held to the bar's end or the section's.
      if (barStart) {
        const len = Math.min(4, sec.to - b) * BEAT + 0.05;
        const vel = name === 'promise' ? 0.15 : name === 'search' ? 0.12 : name === 'groove' ? 0.13 : 0.16;
        const cutoff = name === 'promise' ? 1200 : name === 'search' ? 700 : name === 'groove' ? 2000 : 3000;
        pad(pads, send, t, chord.notes, len, vel, cutoff);
      }

      if (name === 'promise') {
        // Marimba, every other eighth, rising a little as the client answers.
        for (let e = 0; e < 2; e++) {
          if (e === 1 && rel % 2 === 0) continue;
          const note = chord.notes[motif[(rel * 2 + e) % 8] % chord.notes.length] * 2;
          marimba(keys, send, t + (e * BEAT) / 2, note, 0.1, e ? 0.35 : -0.35);
        }
        if (b === 0) bell(keys, send, t, chord.notes[3] * 2, 0.05, 0.2);
      }

      if (name === 'search') {
        // A clock ticking: a soft low pulse on every beat, shaker sixteenths and a nervous
        // two-note marimba figure that climbs.
        kick(drums, t, 0.4);
        for (let k = 0; k < 4; k++) shaker(drums, t + (k * BEAT) / 4, 0.03 + 0.012 * rel);
        const hi = chord.notes[(rel % 2) + 1] * 4;
        marimba(keys, send, t, hi, 0.07 + rel * 0.004, rel % 2 ? 0.4 : -0.4);
        marimba(keys, send, t + BEAT * 0.75, hi * 0.9, 0.05 + rel * 0.004, rel % 2 ? -0.4 : 0.4);
        if (barStart) bass(low, t, chord.root, BEAT * 3.5, 0.22);
      }

      if (name === 'groove' || (name === 'finale' && b < 36)) {
        const finale = name === 'finale';
        kick(drums, t, finale ? 1 : 0.85);
        duck(t);
        if (b % 2 === 1) snap(drums, send, t, 0.6);
        for (let k = 0; k < 4; k++) shaker(drums, t + (k * BEAT) / 4, k % 2 ? 0.04 : 0.07);
        bass(low, t, chord.root * (b % 2 === 1 ? 2 : 1), BEAT * 0.45, 0.4);
        if (b % 2 === 1) bass(low, t + BEAT / 2, chord.root * 2, BEAT * 0.4, 0.3);
        for (let e = 0; e < 2; e++) {
          const note = chord.notes[motif[(rel * 2 + e) % 8] % chord.notes.length] * 2;
          marimba(keys, send, t + (e * BEAT) / 2, note, 0.1, e ? 0.35 : -0.35);
        }
      }

      if (name === 'groove' && b >= 26) {
        // From "at a glance" on, bells sparkle over the top.
        const top = chord.notes[chord.notes.length - 1] * 2;
        if (rel % 2 === 0) bell(keys, send, t, top, 0.05, 0.2);
        if (rel % 4 === 1) bell(keys, send, t + BEAT * 0.5, top * 1.122, 0.045, -0.2);
      }

      if (name === 'finale' && b < 36) {
        const top = chord.notes[chord.notes.length - 1] * 2;
        [0, 1.5, 2, 3].forEach((pos, i) => {
          if (b === 33 || pos === 0 || pos === 2) bell(keys, send, t + pos * BEAT, i === 1 ? top * 1.122 : top, 0.06, 0.2);
        });
      }
    }
  }

  // Riser into the drop (the last four beats of "search"), a roll of snaps just before it and a
  // soft hit on each section change.
  swell(fx, send, 14 * BEAT, 4 * BEAT, 0.12);
  for (let k = 0; k < 4; k++) snap(drums, send, 17 * BEAT + (k * BEAT) / 4 + BEAT / 4, 0.25 + k * 0.08);
  softHit(fx, send, 9 * BEAT, 0.3);
  softHit(fx, send, 18 * BEAT, 0.55);
  swell(fx, send, 31 * BEAT, 2 * BEAT, 0.08);
  softHit(fx, send, 33 * BEAT, 0.6);

  // Outro: the home chord rings out over the last three beats.
  const t37 = 37 * BEAT;
  pad(pads, send, t37, [...CHORDS[0].notes, 392.0], 3 * BEAT, 0.2, 2600);
  bass(low, t37, CHORDS[0].root * 2, 1.6, 0.4);
  [0, 1, 2, 3].forEach((i) => marimba(keys, send, t37 + i * 0.09, CHORDS[0].notes[i] * 2, 0.11, i * 0.2 - 0.3));

  return mix(drums, low, keys, pads, fx, send, sidechain);
}

function mix(drums, low, keys, pads, fx, send, sidechain) {
  pingPong(keys, BEAT * 0.75, 0.3, 0.35);
  const wet = reverb(send, 0.88);
  const out = bus(TOTAL);
  for (let n = 0; n < TOTAL; n++) {
    const sc = sidechain[n];
    for (let ch = 0; ch < 2; ch++) {
      const v =
        drums[ch][n] * 0.8 + low[ch][n] * sc * 0.9 + keys[ch][n] * sc * 0.7 + pads[ch][n] * sc * 0.8 + fx[ch][n] * 0.7 + wet[ch][n] * 0.6;
      out[ch][n] = Math.tanh(v * 1.05);
    }
  }
  normalize(out, 0.9);
  const fadeStart = (DURATION - 1) * SR;
  for (let n = Math.floor(fadeStart); n < TOTAL; n++) {
    const g = Math.max(0, 1 - (n - fadeStart) / (1 * SR));
    out[0][n] *= g;
    out[1][n] *= g;
  }
  return out;
}

writeWav(path.join(OUT, 'music-ar.wav'), song());
