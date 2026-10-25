// Soundtrack for launch video v2: warm, modern pop-electronic at 100 BPM in F major
// (Fmaj7 · Dm9 · B♭maj7 · C6), 19 bars = 45.6 s, arranged to src/v2/timing.ts:
//   bars 1–2 hook (pad + marimba, no drums) · bar 3 intro (beat enters) · bars 4–15 groove ·
//   bar 16 breakdown and swell · bars 17–18 finale lift · bar 19 final chord and tail.
// Everything is synthesized, so the track is original and safe to post anywhere.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS, bass, bell, kick, marimba, pad, shaker, snap, softHit, swell } from './instruments-v2.mjs';
import { SR, add, bus, normalize, pingPong, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 19;
const DURATION = BARS * BAR;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);

const section = (bar) =>
  bar < 2 ? 'hook' : bar === 2 ? 'intro' : bar < 15 ? 'groove' : bar === 15 ? 'break' : bar < 18 ? 'finale' : 'outro';

// ---------------------------------------------------------------------------------------------

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

  // Marimba motif per chord (indices into the chord's notes, as 8th notes), an octave up.
  const motif = [0, 2, 1, 3, 2, 1, 3, 2];

  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * BAR;
    const sec = section(bar);
    const chord = CHORDS[bar % 4];

    if (sec === 'outro') {
      pad(pads, send, t0, [...CHORDS[0].notes, 392.0], BAR + 0.1, 0.22, 2600);
      bass(low, t0, CHORDS[0].root * 2, 1.8, 0.4);
      [0, 1, 2, 3].forEach((i) => marimba(keys, send, t0 + i * 0.09, CHORDS[0].notes[i] * 2, 0.12, i * 0.2 - 0.3));
      continue;
    }

    const padCut = sec === 'hook' ? 700 + 900 * (bar / 2) : sec === 'break' ? 1400 : sec === 'finale' ? 3000 : 2000;
    pad(pads, send, t0, chord.notes, BAR + 0.05, sec === 'hook' ? 0.2 : sec === 'finale' ? 0.2 : 0.14, padCut);

    const drumsOn = sec === 'intro' || sec === 'groove' || sec === 'finale';
    for (let beat = 0; beat < 4; beat++) {
      const tb = t0 + beat * BEAT;
      if (drumsOn) {
        if (sec !== 'intro' || beat % 2 === 0) {
          kick(drums, tb, sec === 'finale' ? 1 : 0.85);
          duck(tb);
        }
        if (beat % 2 === 1) snap(drums, send, tb, 0.7);
        for (let k = 0; k < 4; k++) shaker(drums, tb + (k * BEAT) / 4, k % 2 ? 0.05 : 0.08);
        // Bass: root on the beat, octave on the "and" of 2 and 4.
        bass(low, tb, chord.root * (beat % 2 === 1 ? 2 : 1), BEAT * 0.45, 0.4);
        if (beat % 2 === 1) bass(low, tb + BEAT / 2, chord.root * 2, BEAT * 0.4, 0.3);
      }
      if (sec === 'break' && beat >= 2) snap(drums, send, tb, 0.35);
    }

    // Marimba 8ths: sparse in the hook, full after.
    for (let e = 0; e < 8; e++) {
      if (sec === 'hook' && e % 2 === 1) continue;
      const note = chord.notes[motif[e] % chord.notes.length] * 2;
      marimba(keys, send, t0 + (e * BEAT) / 2, note, sec === 'hook' ? 0.12 : 0.14, e % 2 ? 0.35 : -0.35);
    }

    // A bell melody on top for the bento run and the finale.
    if (bar === 13 || bar === 14 || sec === 'finale') {
      const top = chord.notes[chord.notes.length - 1] * 2;
      [0, 1.5, 2, 3].forEach((beatPos, i) => bell(keys, send, t0 + beatPos * BEAT, i === 1 ? top * 1.122 : top, 0.07, 0.2));
    }
  }

  softHit(fx, send, 2 * BAR, 0.5);
  swell(fx, send, 1.35 * BAR, 0.62 * BAR, 0.12);
  swell(fx, send, 15 * BAR, BAR * 0.97, 0.2);
  softHit(fx, send, 16 * BAR, 0.8);
  softHit(fx, send, 18 * BAR, 0.6);

  pingPong(keys, BEAT * 0.75, 0.3, 0.35);
  const wet = reverb(send, 0.88);

  const out = bus(TOTAL);
  for (let n = 0; n < TOTAL; n++) {
    const sc = sidechain[n];
    for (let ch = 0; ch < 2; ch++) {
      const v =
        drums[ch][n] * 0.85 + low[ch][n] * sc * 0.9 + keys[ch][n] * sc * 0.8 + pads[ch][n] * sc * 0.8 + fx[ch][n] * 0.7 + wet[ch][n] * 0.6;
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

/** A soft two-note scanner chirp, for the QR code being scanned. */
function scan() {
  const b = bus(Math.ceil(0.4 * SR));
  [
    [0, 1318.5],
    [0.09, 1975.5],
  ].forEach(([offset, f]) => {
    const s = Math.round(offset * SR);
    for (let n = 0; n < 0.25 * SR; n++) {
      const tt = n / SR;
      const v = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt / 0.08) * Math.min(1, tt / 0.003) * 0.8;
      add(b, s + n, v, v);
    }
  });
  return normalize(b, 0.8);
}

writeWav(path.join(OUT, 'music-v2.wav'), song());
writeWav(path.join(OUT, 'scan.wav'), scan());
