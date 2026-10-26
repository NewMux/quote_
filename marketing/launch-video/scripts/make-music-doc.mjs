// Score and sound design for the 19 s documentary trailer (src/doc), 120 BPM, cued to the frames in
// src/doc/timing.ts:
//   0–6.5 s the archive: staccato strings in D minor that open up as the cuts speed up, a clock
//   ticking on the beat, then eighths, then sixteenths; a boom on each headline, a thud on each
//   word, a riser into · 6.5–7.5 s dead silence · 7.5 s typewriter keys and a bell under "It's 2026."
//   · 9 s a heartbeat under "You have clients?" · 10 s a braam on "Invoice them." · 11.5–15.5 s a
//   groove under the app, a whoosh per step, a till's ka-ching on "Get paid." · 15.5 s the end card,
//   a hit under the price.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Biquad, SR, add, bus, noise, normalize, rand, reverb, saw, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const FPS = 30;
const BEAT = 0.5;
const DURATION = 570 / FPS;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);
const fr = (frames) => frames / FPS;

// Frames, from src/doc/timing.ts.
const LINES = [0, 30, 60];
const WORDS = [90, 105, 120, 135];
const FAST = [150, 158, 165, 173];
const FLICKS = [180, 184, 188, 192];
const GAP = 195;
const TYPED = 225;
const QUESTION = 270;
const ANSWER = 300;
const STEPS = [345, 375, 405, 435];
const END = 465;
const PRICE = END + 30;

const NOTE = { D2: 73.42, A2: 110, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, Bb3: 233.08, C4: 261.63, D4: 293.66, F4: 349.23, A4: 440, C5: 523.25, F5: 698.46, A5: 880 };

// --- Instruments --------------------------------------------------------------------------------

/** Staccato string section: three detuned saws through a lowpass, a short bowed envelope. */
function stringStab(b, send, t, f, vel, cutoff, len = 0.11) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', cutoff, 0.9);
  const ph = [0, 0.31, 0.67];
  for (let n = 0; n < len * SR; n++) {
    const tt = n / SR;
    let v = 0;
    ph.forEach((_, k) => {
      ph[k] += (f * (1 + (k - 1) * 0.006)) / SR;
      v += saw(ph[k]);
    });
    const env = Math.min(1, tt / 0.006) * Math.exp(-tt / (len * 0.45));
    const out = lp.process(v / 3) * env * vel;
    add(b, s + n, out * 0.9, out);
    add(send, s + n, out * 0.3, out * 0.3);
  }
}

/** Long low string chord (for swells and the end). */
function strings(b, send, t, freqs, dur, vel, cutoff = 1800) {
  const s = Math.round(t * SR);
  const lp = [new Biquad('lowpass', cutoff, 0.7), new Biquad('lowpass', cutoff, 0.7)];
  const voices = freqs.flatMap((f) => [-8, 0, 8].map((c) => ({ f: f * 2 ** (c / 1200), ph: (f * c) % 1, pan: c / 12 })));
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / 0.25) * Math.min(1, (dur - tt) / 0.4);
    let L = 0;
    let R = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const w = saw(v.ph);
      L += w * (1 - v.pan);
      R += w * (1 + v.pan);
    }
    L = (lp[0].process(L) / voices.length) * env * vel * 2;
    R = (lp[1].process(R) / voices.length) * env * vel * 2;
    add(b, s + n, L, R);
    add(send, s + n, L * 0.5, R * 0.5);
  }
}

/** Clock tick: a dry woodblock click. */
function tick(b, t, vel = 0.25, f = 2100) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', f, 6);
  for (let n = 0; n < 0.05 * SR; n++) {
    const tt = n / SR;
    const v = (Math.sin(2 * Math.PI * f * tt) * 0.6 + bp.process(noise()) * 2) * Math.exp(-tt / 0.006) * vel;
    add(b, s + n, v, v);
  }
}

/** A deep cinematic boom: a sub that drops in pitch, plus a dark thump. */
function boom(b, send, t, vel = 1, len = 2) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 900, 0.7);
  let ph = 0;
  for (let n = 0; n < len * SR; n++) {
    const tt = n / SR;
    ph += (34 + 70 * Math.exp(-tt / 0.07)) / SR;
    const v = (Math.tanh(Math.sin(2 * Math.PI * ph) * 2.2) * Math.exp(-tt / (len * 0.4)) + lp.process(noise()) * Math.exp(-tt / 0.08) * 0.6) * vel;
    add(b, s + n, v, v);
    add(send, s + n, v * 0.25, v * 0.25);
  }
}

/** A short thud for the word cuts. */
function thud(b, t, vel = 0.7) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.25 * SR; n++) {
    const tt = n / SR;
    ph += (55 + 160 * Math.exp(-tt / 0.015)) / SR;
    const v = (Math.tanh(Math.sin(2 * Math.PI * ph) * 3) * Math.exp(-tt / 0.08) + noise() * Math.exp(-tt / 0.004) * 0.4) * vel;
    add(b, s + n, v, v);
  }
}

/** Rising noise + saw riser ending at `t + dur`. */
function riser(b, send, t, dur, vel = 0.3) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 300, 1);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    if (n % 32 === 0) bp.set('bandpass', 300 * 20 ** p, 1.3);
    ph += (90 * 10 ** p) / SR;
    const v = (saw(ph) * 0.15 + bp.process(noise()) * 1.3) * p ** 2.2 * vel;
    add(b, s + n, v * (1 - p * 0.3), v * (0.7 + p * 0.3));
    add(send, s + n, v * 0.3, v * 0.3);
  }
}

/** Typewriter key: a sharp strike and the typebar's clack. Space is a duller thunk. */
function key(b, t, vel = 0.5, space = false) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', space ? 700 : 2600, 2);
  const lp = new Biquad('lowpass', 500, 0.7);
  for (let n = 0; n < 0.07 * SR; n++) {
    const tt = n / SR;
    const strike = bp.process(noise()) * Math.exp(-tt / 0.004) * 2.2;
    const body = lp.process(noise()) * Math.exp(-tt / 0.02) * 1.2;
    const v = (strike + body) * vel * (0.85 + rand() * 0.3);
    add(b, s + n, v, v * 0.92);
  }
}

/** Typewriter bell / till bell. */
function ding(b, send, t, vel = 0.25, f = 2350) {
  const s = Math.round(t * SR);
  for (let n = 0; n < 1.4 * SR; n++) {
    const tt = n / SR;
    const v = (Math.sin(2 * Math.PI * f * tt) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * tt) * Math.exp(-tt / 0.1)) * Math.exp(-tt / 0.45) * Math.min(1, tt / 0.001) * vel;
    add(b, s + n, v, v);
    add(send, s + n, v * 0.4, v * 0.4);
  }
}

/** The till: drawer rattle, then the bell. */
function kaChing(b, send, t, vel = 0.5) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 4000, 1.5);
  for (let n = 0; n < 0.12 * SR; n++) {
    const tt = n / SR;
    const rattle = bp.process(noise()) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 90 * tt)) * Math.exp(-tt / 0.05);
    add(b, s + n, rattle * vel, rattle * vel);
  }
  ding(b, send, t + 0.09, 0.35 * vel * 2, 2640);
  ding(b, send, t + 0.1, 0.2 * vel * 2, 3520);
}

/** Braam: a huge low brass-like chord, distorted, swelling and decaying. */
function braam(b, send, t, freqs, dur = 2.4, vel = 0.6) {
  const s = Math.round(t * SR);
  const lp = [new Biquad('lowpass', 1200, 0.9), new Biquad('lowpass', 1200, 0.9)];
  const voices = freqs.flatMap((f) => [-12, 0, 12].map((c) => ({ f: f * 2 ** (c / 1200), ph: 0, pan: c / 18 })));
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    if (n % 64 === 0) lp.forEach((x) => x.set('lowpass', 500 + 2200 * Math.exp(-tt / 0.5), 0.9));
    const env = Math.min(1, tt / 0.03) * Math.exp(-tt / (dur * 0.5));
    let L = 0;
    let R = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const w = saw(v.ph);
      L += w * (1 - v.pan);
      R += w * (1 + v.pan);
    }
    L = Math.tanh((lp[0].process(L) / voices.length) * 6) * env * vel;
    R = Math.tanh((lp[1].process(R) / voices.length) * 6) * env * vel;
    add(b, s + n, L, R);
    add(send, s + n, L * 0.5, R * 0.5);
  }
}

function whoosh(b, t, dur = 0.35, vel = 0.25) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 800, 0.8);
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    if (n % 32 === 0) bp.set('bandpass', 600 + 4000 * Math.sin(Math.PI * p), 0.8);
    const v = bp.process(noise()) * Math.sin(Math.PI * p) ** 2 * vel * 2;
    add(b, s + n, v * (1 - p), v * p);
  }
}

function kick(b, t, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.3 * SR; n++) {
    const tt = n / SR;
    ph += (48 + 180 * Math.exp(-tt / 0.025)) / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * 2.5 * Math.exp(-tt / 0.14)) * 0.85 * vel;
    add(b, s + n, v, v);
  }
}

function clap(b, send, t, vel = 0.7) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 1500, 1.4);
  for (let n = 0; n < 0.2 * SR; n++) {
    const tt = n / SR;
    const bursts = [0, 0.009, 0.018].reduce((e, o) => e + (tt >= o ? Math.exp(-(tt - o) / 0.006) : 0), 0);
    const v = bp.process(noise()) * (bursts * 0.7 + Math.exp(-tt / 0.06) * 0.6) * 2 * vel;
    add(b, s + n, v, v);
    add(send, s + n, v * 0.3, v * 0.3);
  }
}

function hat(b, t, vel = 0.1) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 8000, 0.8);
  for (let n = 0; n < 0.04 * SR; n++) {
    const v = hp.process(noise()) * Math.exp(-n / SR / 0.01) * vel;
    add(b, s + n, v * 0.8, v);
  }
}

function bass(b, t, f, dur, vel = 0.4) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    ph += f / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * 1.6) * Math.min(1, tt / 0.005) * Math.min(1, (dur - tt) / 0.02) * vel;
    add(b, s + n, v, v);
  }
}

// --- Arrangement --------------------------------------------------------------------------------

function song() {
  const mus = bus(TOTAL);
  const sfx = bus(TOTAL);
  const send = bus(TOTAL);
  const archiveEnd = fr(GAP);

  // The archive: a D minor ostinato in sixteenths that opens up and gets louder.
  const pattern = [NOTE.D3, NOTE.D3, NOTE.F3, NOTE.D3, NOTE.A3, NOTE.D3, NOTE.F3, NOTE.E3];
  const bass2 = [NOTE.D2, NOTE.D2, NOTE.D2, NOTE.D2, 58.27, 58.27, 65.41, 65.41];
  for (let i = 0; i * 0.125 < archiveEnd - 0.01; i++) {
    const t = i * 0.125;
    const p = t / archiveEnd;
    // The figure climbs a whole step for the last two seconds, and a minor third for the last half.
    const lift = t >= 6 ? 1.189 : t >= 4 ? 1.122 : 1;
    stringStab(mus, send, t, pattern[i % 8] * lift, 0.09 + p * 0.13, 700 + p * 3500);
    if (i % 4 === 0) stringStab(mus, send, t, bass2[Math.floor(i / 4) % 8], 0.12 + p * 0.1, 500 + p * 1200, 0.2);
  }
  strings(mus, send, 0, [NOTE.D2, NOTE.A2, NOTE.D3], archiveEnd, 0.1, 900);

  // The clock: beats, then eighths, then sixteenths.
  for (let t = 0; t < fr(WORDS[0]); t += BEAT) tick(sfx, t, 0.22);
  for (let t = fr(WORDS[0]); t < fr(FAST[0]); t += BEAT / 2) tick(sfx, t, 0.24);
  for (let t = fr(FAST[0]); t < archiveEnd - 0.01; t += BEAT / 4) tick(sfx, t, 0.26, 2300);

  // Hits on the cuts.
  LINES.forEach((f, i) => boom(sfx, send, fr(f), 0.8 + i * 0.1, 1.6));
  WORDS.forEach((f) => thud(sfx, fr(f), 0.8));
  FAST.forEach((f) => thud(sfx, fr(f), 0.55));
  FLICKS.forEach((f) => thud(sfx, fr(f), 0.4));
  riser(sfx, send, fr(WORDS[2]), archiveEnd - fr(WORDS[2]), 0.32);

  // Silence (GAP → TYPED), then the typewriter.
  const line1 = 'It’s 2026.';
  const line2 = 'You’re still waiting.';
  for (let k = 0; k < line1.length + 4 + line2.length; k++) {
    const t = fr(TYPED + k * 1.2);
    if (t >= fr(QUESTION)) break;
    const ch = k < line1.length ? line1[k] : k < line1.length + 4 ? null : line2[k - line1.length - 4];
    if (ch === null) continue;
    key(sfx, t, ch === ' ' ? 0.3 : 0.5, ch === ' ');
  }
  ding(sfx, send, fr(TYPED + line1.length * 1.2 + 2), 0.22);

  // "You have clients?": a heartbeat and a low string.
  [0, 0.32].forEach((o, i) => kick(sfx, fr(QUESTION) + o, i ? 0.55 : 0.75));
  [0, 0.32].forEach((o, i) => kick(sfx, fr(QUESTION) + 0.5 + o, i ? 0.55 : 0.75));
  strings(mus, send, fr(QUESTION), [NOTE.D2, NOTE.A2], fr(ANSWER - QUESTION) + 0.1, 0.12, 700);
  riser(sfx, send, fr(QUESTION) + 0.4, fr(ANSWER - QUESTION) - 0.4, 0.22);

  // "Invoice them.": braam.
  braam(mus, send, fr(ANSWER), [NOTE.D2, NOTE.A2, NOTE.D3, NOTE.F3], 2.6, 0.55);
  boom(sfx, send, fr(ANSWER), 1.1, 2.2);

  // The app: a groove in F, a whoosh per step, the till on "Get paid."
  const prog = [NOTE.F3 / 2, NOTE.D3 / 2, NOTE.Bb3 / 4, NOTE.C4 / 4];
  for (let beat = 0; beat < 8; beat++) {
    const t = fr(STEPS[0]) + beat * BEAT;
    const root = prog[Math.floor(beat / 2) % 4];
    kick(sfx, t, 0.9);
    if (beat % 2 === 1) clap(sfx, send, t, 0.6);
    for (let k = 0; k < 4; k++) hat(sfx, t + (k * BEAT) / 4, k % 2 ? 0.06 : 0.1);
    bass(mus, t, root, BEAT * 0.4, 0.35);
    bass(mus, t + BEAT / 2, root * 2, BEAT * 0.35, 0.3);
    [4, 5, 6].forEach((h) => stringStab(mus, send, t + BEAT / 2, root * h, 0.06, 3500, 0.09));
  }
  STEPS.forEach((f) => whoosh(sfx, fr(f) - 0.18, 0.36, 0.22));
  kaChing(sfx, send, fr(STEPS[3]) + 0.2, 0.55);

  // End card.
  boom(sfx, send, fr(END), 0.9, 2.4);
  strings(mus, send, fr(END), [NOTE.F3 / 2, NOTE.C4 / 2, NOTE.F3, NOTE.A3, NOTE.C4], DURATION - fr(END), 0.16, 2400);
  thud(sfx, fr(PRICE), 0.8);
  ding(sfx, send, fr(PRICE) + 0.05, 0.12, 1760);
  ding(sfx, send, fr(PRICE) + 0.17, 0.1, 2637);

  const wet = reverb(send, 0.85);
  const out = bus(TOTAL);
  const gapFrom = Math.round(fr(GAP) * SR);
  const gapTo = Math.round(fr(TYPED) * SR);
  for (let n = 0; n < TOTAL; n++) {
    const silent = n >= gapFrom && n < gapTo;
    for (let ch = 0; ch < 2; ch++) {
      const dry = mus[ch][n] * 0.85 + sfx[ch][n] * 0.9;
      const v = (silent ? 0 : dry) + wet[ch][n] * (silent ? 0.15 : 0.5);
      out[ch][n] = Math.tanh(v * 1.2);
    }
  }
  normalize(out, 0.93);
  const fadeStart = (DURATION - 1.2) * SR;
  for (let n = Math.floor(fadeStart); n < TOTAL; n++) {
    const g = Math.max(0, 1 - (n - fadeStart) / (1.2 * SR));
    out[0][n] *= g;
    out[1][n] *= g;
  }
  return out;
}

writeWav(path.join(OUT, 'music-doc.wav'), song());
