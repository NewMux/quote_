// Soundtrack for the 15 s ad: v2's instruments and key (100 BPM, F major), 24 beats = 14.4 s,
// arranged to src/ad/timing.ts. Bars start one beat in, so the cuts land on downbeats:
//   beat 0 pickup swell · bar 1 hook (pad + marimba, no drums) · bars 2–4 groove (create, sign,
//   pay) · bar 5 finale lift with bells · the final chord rings out over the last three beats.
// It sits under a voiceover, so it is sparser than v2's: no snare fills, quieter keys.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS, bass, bell, kick, marimba, pad, shaker, snap, softHit, swell } from './instruments-v2.mjs';
import { SR, bus, normalize, pingPong, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BEATS = 24;
const DURATION = BEATS * BEAT;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);
const barStart = (bar) => BEAT + bar * BAR;

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

  // Pickup: the C6 pad swells into the first downbeat.
  pad(pads, send, 0, CHORDS[3].notes, BEAT + 0.1, 0.12, 900);
  swell(fx, send, 0, BEAT, 0.08);

  // Bar 0 hook · 1 create · 2 sign · 3 pay · 4 finale.
  for (let bar = 0; bar < 5; bar++) {
    const t0 = barStart(bar);
    const hook = bar === 0;
    const finale = bar === 4;
    const chord = CHORDS[bar % 4];
    pad(pads, send, t0, chord.notes, BAR + 0.05, hook ? 0.18 : 0.13, hook ? 1100 : finale ? 3000 : 2000);

    for (let beat = 0; beat < 4; beat++) {
      const tb = t0 + beat * BEAT;
      if (hook) continue;
      kick(drums, tb, finale ? 1 : 0.85);
      duck(tb);
      if (beat % 2 === 1) snap(drums, send, tb, 0.6);
      for (let k = 0; k < 4; k++) shaker(drums, tb + (k * BEAT) / 4, k % 2 ? 0.04 : 0.07);
      bass(low, tb, chord.root * (beat % 2 === 1 ? 2 : 1), BEAT * 0.45, 0.4);
      if (beat % 2 === 1) bass(low, tb + BEAT / 2, chord.root * 2, BEAT * 0.4, 0.3);
    }

    for (let e = 0; e < 8; e++) {
      if (hook && e % 2 === 1) continue;
      const note = chord.notes[motif[e] % chord.notes.length] * 2;
      marimba(keys, send, t0 + (e * BEAT) / 2, note, 0.11, e % 2 ? 0.35 : -0.35);
    }

    if (finale) {
      const top = chord.notes[chord.notes.length - 1] * 2;
      [0, 1.5, 2, 3].forEach((beatPos, i) => bell(keys, send, t0 + beatPos * BEAT, i === 1 ? top * 1.122 : top, 0.07, 0.2));
    }
  }

  swell(fx, send, barStart(1) - BAR * 0.5, BAR * 0.5, 0.1);
  softHit(fx, send, barStart(1), 0.45);
  softHit(fx, send, barStart(4), 0.6);

  // Outro: the home chord rings out over the last three beats.
  const t5 = barStart(5);
  pad(pads, send, t5, [...CHORDS[0].notes, 392.0], 3 * BEAT, 0.2, 2600);
  bass(low, t5, CHORDS[0].root * 2, 1.6, 0.4);
  [0, 1, 2, 3].forEach((i) => marimba(keys, send, t5 + i * 0.09, CHORDS[0].notes[i] * 2, 0.11, i * 0.2 - 0.3));

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

writeWav(path.join(OUT, 'music-ad.wav'), song());
