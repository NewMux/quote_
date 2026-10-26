// Score for the 40.4 s documentary reel "A short history of getting paid." (src/doc), cued in
// seconds to src/doc/timing.ts:
//   0 Franklin: a low drone, a first piano note · 3.5 chapter I (1925): projector clatter, a slow
//   piano line in D minor · 13.7 chapter II (1945): the line moves to B♭ · 20.9 chapter III
//   (1950s): F, then C · 25.4 "Today": the projector stops, one held low note · 28.2 "You have
//   clients?": a heartbeat · 29.7 "Invoice them.": the harmony opens to F major · 31.7 the app: a
//   light marimba pulse · 36.5 end card: the home chord, a chime under the price at 38.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bell, kick, marimba, pad, shaker, softHit, swell } from './instruments-v2.mjs';
import { Biquad, SR, add, bus, noise, normalize, reverb, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const DURATION = 40.4;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);

const CUE = { cash: 3.5, office: 13.7, call: 20.8, now: 25.3, question: 28.1, answer: 29.6, app: 31.6, end: 36.4, price: 37.9 };

// D minor and its relatives, piano voicings.
const N = { D2: 73.42, F2: 87.31, A2: 110, Bb1: 58.27, C2: 65.41, D3: 146.83, F3: 174.61, A3: 220, Bb2: 116.54, C3: 130.81, E3: 164.81, G3: 196, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, Bb3: 233.08, C4: 261.63, C5: 523.25, D5: 587.33 };

/** A soft felt piano: decaying harmonics, a little hammer, slightly stretched partials. */
function piano(b, send, t, f, vel = 0.2, pan = 0, len = 3.2) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 2600, 0.7);
  for (let n = 0; n < len * SR; n++) {
    const tt = n / SR;
    let v = 0;
    for (let k = 1; k <= 6; k++) {
      const fk = f * k * (1 + 0.0004 * k * k);
      v += (Math.sin(2 * Math.PI * fk * tt) / k ** 1.4) * Math.exp(-tt / (1.6 / k ** 0.6));
    }
    const hammer = n < 0.01 * SR ? noise() * (1 - n / (0.01 * SR)) * 0.2 : 0;
    const out = lp.process(v + hammer) * Math.min(1, tt / 0.003) * Math.min(1, (len - tt) / 0.2) * vel;
    add(b, s + n, out * (1 - pan), out * (1 + pan));
    add(send, s + n, out * 0.55, out * 0.55);
  }
}

/** Old projector: the shutter's 24 fps clatter and a faint motor, from `from` to `to` seconds. */
function projector(b, from, to, vel = 0.05) {
  const lp = new Biquad('lowpass', 2200, 0.7);
  const hp = new Biquad('highpass', 300, 0.7);
  const s0 = Math.round(from * SR);
  const s1 = Math.round(to * SR);
  for (let n = s0; n < s1; n++) {
    const tt = (n - s0) / SR;
    const phase = (tt * 24) % 1;
    const click = Math.exp(-phase / 0.06);
    const motor = Math.sin(2 * Math.PI * 60 * tt) * 0.15 + Math.sin(2 * Math.PI * 120 * tt) * 0.08;
    const edge = Math.min(1, tt / 0.4) * Math.min(1, (to - from - tt) / 0.15);
    const v = (hp.process(lp.process(noise())) * click * 0.9 + motor * 0.25 + noise() * 0.04) * vel * edge;
    add(b, n, v, v * 0.95);
  }
}

function song() {
  const keys = bus(TOTAL);
  const pads = bus(TOTAL);
  const fx = bus(TOTAL);
  const drums = bus(TOTAL);
  const send = bus(TOTAL);

  // Cold open: drone and one note.
  pad(pads, send, 0, [N.D2, N.A2, N.D3], CUE.now + 0.2, 0.12, 700);
  piano(keys, send, 0.4, N.D4, 0.16, 0, 3);
  piano(keys, send, 1.9, N.A3, 0.12, -0.2, 3);

  // The archive: projector under all three chapters.
  projector(fx, CUE.cash - 0.1, CUE.now, 0.05);
  softHit(fx, send, CUE.cash, 0.35);

  // Chapter I — 1925, D minor.
  const lineI = [N.F4, N.E4, N.D4, N.A3, N.F4, N.G4, N.A4, N.E4];
  lineI.forEach((f, i) => piano(keys, send, CUE.cash + 0.2 + i * 1.2, f, 0.15, i % 2 ? 0.2 : -0.2));
  [0, 4.8].forEach((o) => piano(keys, send, CUE.cash + o, N.D3, 0.13, 0, 4.5));

  // Chapter II — 1945, B♭.
  softHit(fx, send, CUE.office, 0.35);
  pad(pads, send, CUE.office, [N.Bb1, N.F2, N.Bb2, N.D3], CUE.call - CUE.office + 0.3, 0.1, 900);
  const lineII = [N.D4, N.F4, N.Bb3, N.C4, N.D4, N.F4];
  lineII.forEach((f, i) => piano(keys, send, CUE.office + 0.1 + i * 1.2, f, 0.15, i % 2 ? 0.2 : -0.2));
  piano(keys, send, CUE.office, N.Bb2, 0.13, 0, 4.5);

  // Chapter III — 1950s, F then C.
  softHit(fx, send, CUE.call, 0.35);
  pad(pads, send, CUE.call, [N.F2, N.C3, N.F3, N.A3], 2.4, 0.1, 1100);
  pad(pads, send, CUE.call + 2.3, [N.C2, N.G3, N.C3, N.E3], CUE.now - CUE.call - 2.1, 0.1, 1100);
  [N.A4, N.G4, N.F4, N.E4].forEach((f, i) => piano(keys, send, CUE.call + 0.1 + i * 1.1, f, 0.15, i % 2 ? 0.2 : -0.2));
  piano(keys, send, CUE.call, N.F3, 0.13, 0, 2.4);
  piano(keys, send, CUE.call + 2.3, N.C3, 0.13, 0, 2.4);

  // Today: the projector stops. One held low D and a high, quiet note.
  piano(keys, send, CUE.now, N.D3, 0.16, 0, 3);
  piano(keys, send, CUE.now + 1.4, N.D5, 0.07, 0.3, 2.5);
  pad(pads, send, CUE.now, [N.D2, N.A2], CUE.question - CUE.now + 0.3, 0.08, 500);

  // "You have clients?": a heartbeat.
  [0, 0.38, 0.9, 1.28].forEach((o, i) => kick(drums, CUE.question + o, i % 2 ? 0.45 : 0.6));
  swell(fx, send, CUE.answer - 0.8, 0.8, 0.12);

  // "Invoice them.": the harmony opens.
  softHit(fx, send, CUE.answer, 0.7);
  kick(drums, CUE.answer, 0.9);
  pad(pads, send, CUE.answer, [N.F2, N.C3, N.F3, N.A3, N.C4], CUE.end - CUE.answer + 0.2, 0.13, 2400);
  [N.F4, N.A4, N.C5].forEach((f, k) => bell(keys, send, CUE.answer + 0.05 + k * 0.12, f, 0.06, k * 0.3 - 0.3));

  // The app: a light marimba pulse, one step every 1.2 s.
  for (let i = 0; i < 8; i++) {
    const t = CUE.app + i * 0.6;
    kick(drums, t, i % 2 ? 0.55 : 0.75);
    for (let k = 0; k < 4; k++) shaker(drums, t + k * 0.15, k % 2 ? 0.03 : 0.055);
    marimba(keys, send, t, [N.F4, N.A4, N.C5, N.A4][i % 4], 0.09, i % 2 ? 0.3 : -0.3);
  }

  // End card: D minor resolved to F, the price chime.
  softHit(fx, send, CUE.end, 0.6);
  pad(pads, send, CUE.end, [N.F2, N.C3, N.F3, N.A3, N.D4], DURATION - CUE.end, 0.16, 2600);
  piano(keys, send, CUE.end, N.F3, 0.16, 0, 4);
  piano(keys, send, CUE.end + 0.02, N.A3, 0.13, -0.2, 4);
  piano(keys, send, CUE.end + 0.04, N.C4, 0.12, 0.2, 4);
  [N.C5, N.F4, N.A4].forEach((f, k) => bell(keys, send, CUE.price + k * 0.12, f * 2, 0.045, k * 0.3 - 0.3));

  const wet = reverb(send, 0.9);
  const out = bus(TOTAL);
  for (let n = 0; n < TOTAL; n++) {
    for (let ch = 0; ch < 2; ch++) {
      const v = keys[ch][n] * 0.9 + pads[ch][n] * 0.75 + fx[ch][n] * 0.8 + drums[ch][n] * 0.7 + wet[ch][n] * 0.6;
      out[ch][n] = Math.tanh(v * 1.1);
    }
  }
  normalize(out, 0.9);
  const fadeStart = (DURATION - 1.5) * SR;
  for (let n = Math.floor(fadeStart); n < TOTAL; n++) {
    const g = Math.max(0, 1 - (n - fadeStart) / (1.5 * SR));
    out[0][n] *= g;
    out[1][n] *= g;
  }
  return out;
}

writeWav(path.join(OUT, 'music-doc.wav'), song());
