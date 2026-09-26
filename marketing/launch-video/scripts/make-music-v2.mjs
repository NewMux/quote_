// Soundtrack for launch video v2: warm, modern pop-electronic at 100 BPM in F major
// (Fmaj7 · Dm9 · B♭maj7 · C6), 19 bars = 45.6 s, arranged to src/v2/timing.ts:
//   bars 1–2 hook (pad + marimba, no drums) · bar 3 intro (beat enters) · bars 4–15 groove ·
//   bar 16 breakdown and swell · bars 17–18 finale lift · bar 19 final chord and tail.
// Everything is synthesized, so the track is original and safe to post anywhere.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Biquad, SR, add, bus, noise, normalize, pingPong, rand, reverb, saw, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 19;
const DURATION = BARS * BAR;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);

const CHORDS = [
  { root: 43.65, notes: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
  { root: 73.42, notes: [146.83, 174.61, 220.0, 261.63, 329.63] }, // Dm9
  { root: 58.27, notes: [116.54, 146.83, 174.61, 220.0] }, // B♭maj7
  { root: 65.41, notes: [130.81, 164.81, 196.0, 220.0] }, // C6
];

const section = (bar) =>
  bar < 2 ? 'hook' : bar === 2 ? 'intro' : bar < 15 ? 'groove' : bar === 15 ? 'break' : bar < 18 ? 'finale' : 'outro';

// ---------------------------------------------------------------------------------------------

function kick(b, t, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.4 * SR; n++) {
    const tt = n / SR;
    ph += (48 + 70 * Math.exp(-tt / 0.028)) / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.22) * Math.min(1, tt / 0.002) * 1.3) * 0.85 * vel;
    add(b, s + n, v, v);
  }
}

function snap(b, send, t, vel = 1) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 2300, 1.1);
  for (let n = 0; n < 0.18 * SR; n++) {
    const tt = n / SR;
    const env = Math.exp(-tt / 0.035) + 0.6 * Math.exp(-Math.max(0, tt - 0.008) / 0.02) * (tt > 0.008 ? 1 : 0);
    const v = bp.process(noise()) * env * 1.6 * vel;
    add(b, s + n, v * 0.9, v);
    add(send, s + n, v * 0.35, v * 0.35);
  }
}

function shaker(b, t, vel = 0.08) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 6000, 0.7);
  for (let n = 0; n < 0.09 * SR; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / 0.012) * Math.exp(-tt / 0.03);
    const v = hp.process(noise()) * env * vel;
    add(b, s + n, v * 0.7, v * 1.2);
  }
}

function bass(b, t, f, dur, vel = 0.42) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 500, 0.8);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    ph += f / SR;
    const tri = 1 - 4 * Math.abs((ph % 1) - 0.5);
    const env = Math.min(1, tt / 0.006) * Math.min(1, (dur - tt) / 0.03) * (0.75 + 0.25 * Math.exp(-tt / 0.12));
    const v = (Math.sin(2 * Math.PI * ph) * 0.85 + lp.process(tri) * 0.3) * env * vel;
    add(b, s + n, v, v);
  }
}

function marimba(b, send, t, f, vel = 0.16, pan = 0) {
  const s = Math.round(t * SR);
  for (let n = 0; n < 0.9 * SR; n++) {
    const tt = n / SR;
    const v =
      (Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt / 0.32) +
        0.35 * Math.sin(2 * Math.PI * f * 3.98 * tt) * Math.exp(-tt / 0.045) +
        0.12 * Math.sin(2 * Math.PI * f * 9.1 * tt) * Math.exp(-tt / 0.012)) *
      Math.min(1, tt / 0.0015) *
      vel;
    add(b, s + n, v * (1 - pan), v * (1 + pan));
    add(send, s + n, v * 0.3, v * 0.3);
  }
}

function bell(b, send, t, f, vel = 0.08, pan = 0) {
  const s = Math.round(t * SR);
  for (let n = 0; n < 1.6 * SR; n++) {
    const tt = n / SR;
    const v =
      (Math.sin(2 * Math.PI * f * tt) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt / 0.25)) *
      Math.exp(-tt / 0.6) *
      Math.min(1, tt / 0.003) *
      vel;
    add(b, s + n, v * (1 - pan), v * (1 + pan));
    add(send, s + n, v * 0.6, v * 0.6);
  }
}

function pad(b, send, t, freqs, dur, vel, cutoff) {
  const s = Math.round(t * SR);
  const filters = [new Biquad(), new Biquad()];
  filters.forEach((f) => f.set('lowpass', cutoff, 0.7));
  const voices = [];
  for (const f of freqs) for (const cents of [-9, 0, 9]) voices.push({ f: f * 2 ** (cents / 1200), ph: rand(), pan: cents / 22 });
  const norm = 3 / voices.length;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / 0.35) * Math.min(1, Math.max(0, dur - tt) / 0.4);
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * (t + tt));
    let L = 0;
    let R = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const w = saw(v.ph) * 0.6 + Math.sin(2 * Math.PI * v.ph) * 0.4;
      L += w * (1 - v.pan);
      R += w * (1 + v.pan);
    }
    L = filters[0].process(L) * env * vel * norm * lfo;
    R = filters[1].process(R) * env * vel * norm * lfo;
    add(b, s + n, L, R);
    add(send, s + n, L * 0.5, R * 0.5);
  }
}

function swell(b, send, t, dur, vel = 0.18) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 300, 0.9);
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    if (n % 32 === 0) bp.set('bandpass', 300 * 20 ** p, 0.9);
    const v = bp.process(noise()) * p ** 2.2 * vel * 3;
    add(b, s + n, v * (1 - p * 0.3), v * (0.7 + p * 0.3));
    add(send, s + n, v * 0.5, v * 0.5);
  }
}

function softHit(b, send, t, vel = 0.7) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 1400, 0.7);
  let ph = 0;
  for (let n = 0; n < 1.8 * SR; n++) {
    const tt = n / SR;
    ph += (40 + 50 * Math.exp(-tt / 0.2)) / SR;
    const v = (Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.7) * 0.8 + lp.process(noise()) * Math.exp(-tt / 0.25) * 0.4) * vel;
    add(b, s + n, v, v);
    add(send, s + n, v * 0.6, v * 0.6);
  }
}

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
