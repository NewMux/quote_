// Soundtrack for the 20 s "You have clients? Invoice them." hype reel: 120 BPM trap-style, D minor
// (Dm · B♭ · F · C), 40 beats = 20 s, arranged to src/reel/timing.ts:
//   0–2 the question: an impact and an 808 on each word · 2–6 the client roll: half-time groove,
//   a tick on every card · 6–8 the build: snare roll and riser, cut to silence on the last 16th ·
//   8 THE DROP: impact, stabs, full groove through the product (8–26) · 26–30 the PAID roll:
//   16th ticks · 30 impact on the total · 32–34 tagline · 34 end card impact, 808 rings out.
// Its own drum kit (808, clap, hats, impact, riser) lives here; pads and bells come from v2's rack.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bell, pad } from './instruments-v2.mjs';
import { Biquad, SR, add, bus, noise, normalize, rand, reverb, saw, writeWav } from './synth.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const BPM = 120;
const BEAT = 60 / BPM;
const BEATS = 40;
const DURATION = BEATS * BEAT;
const TOTAL = Math.ceil((DURATION + 0.02) * SR);
const at = (beat) => beat * BEAT;

// D minor: Dm · B♭ · F · C, one chord per bar. Roots for the 808, triads for the stabs.
const PROG = [
  { root: 73.42, notes: [293.66, 349.23, 440.0] },
  { root: 58.27, notes: [233.08, 293.66, 349.23] },
  { root: 87.31, notes: [261.63, 349.23, 440.0] },
  { root: 65.41, notes: [261.63, 329.63, 392.0] },
];
const chordAt = (beat) => PROG[Math.floor(beat / 4) % 4];

// --- Kit ---------------------------------------------------------------------------------------

/** Distorted 808: a sine that drops from a click into the note and sustains. */
function k808(b, t, f, dur = 0.6, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    ph += (f + 160 * Math.exp(-tt / 0.03)) / SR;
    const env = Math.min(1, tt / 0.001) * Math.exp(-tt / (dur * 0.55)) * Math.min(1, (dur - tt) / 0.02);
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * 2.6) * env * 0.8 * vel;
    add(b, s + n, v, v);
  }
}

/** Punchy kick for the four-on-the-floor sections. */
function kick(b, t, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.3 * SR; n++) {
    const tt = n / SR;
    ph += (50 + 220 * Math.exp(-tt / 0.02)) / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * 3 * Math.exp(-tt / 0.12)) * 0.85 * vel + noise() * Math.exp(-tt / 0.002) * 0.3 * vel;
    add(b, s + n, v, v);
  }
}

function clap(b, send, t, vel = 1) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 1500, 1.4);
  for (let n = 0; n < 0.25 * SR; n++) {
    const tt = n / SR;
    const bursts = [0, 0.009, 0.018].reduce((e, o) => e + (tt >= o ? Math.exp(-(tt - o) / 0.006) : 0), 0);
    const env = bursts * 0.7 + Math.exp(-tt / 0.07) * 0.6;
    const v = bp.process(noise()) * env * 2.2 * vel;
    add(b, s + n, v * 0.95, v);
    add(send, s + n, v * 0.4, v * 0.4);
  }
}

function hat(b, t, vel = 0.1, open = false) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 8000, 0.8);
  const len = open ? 0.25 : 0.05;
  for (let n = 0; n < len * SR; n++) {
    const tt = n / SR;
    const v = hp.process(noise()) * Math.exp(-tt / (open ? 0.08 : 0.012)) * vel;
    add(b, s + n, v * 0.8, v * 1.1);
  }
}

/** Cinematic impact: a sub boom that glides down plus a dark crash. */
function impact(b, send, t, vel = 1) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 3000, 0.6);
  let ph = 0;
  for (let n = 0; n < 2.4 * SR; n++) {
    const tt = n / SR;
    ph += (30 + 90 * Math.exp(-tt / 0.08)) / SR;
    const boom = Math.tanh(Math.sin(2 * Math.PI * ph) * 2) * Math.exp(-tt / 0.9);
    const crash = lp.process(noise()) * Math.exp(-tt / 0.5);
    const v = (boom * 0.9 + crash * 0.55) * vel;
    add(b, s + n, v, v);
    add(send, s + n, crash * 0.5 * vel, crash * 0.5 * vel);
  }
}

/** Rising saw + noise sweep over `dur`, ending at `t + dur`. */
function riser(b, send, t, dur, vel = 0.3) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 400, 1);
  const phs = [0, 0.33, 0.66];
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    if (n % 32 === 0) bp.set('bandpass', 400 * 25 ** p, 1.2);
    const f = 110 * 8 ** p;
    let sw = 0;
    phs.forEach((_, k) => {
      phs[k] += (f * (1 + (k - 1) * 0.012)) / SR;
      sw += saw(phs[k]);
    });
    const v = (sw * 0.12 + bp.process(noise()) * 1.4) * p ** 2 * vel;
    add(b, s + n, v * (1 - p * 0.4), v * (0.6 + p * 0.4));
    add(send, s + n, v * 0.3, v * 0.3);
  }
}

/** Short supersaw chord stab. */
function stab(b, send, t, freqs, vel = 0.25, dur = 0.22) {
  const s = Math.round(t * SR);
  const lp = [new Biquad('lowpass', 5000, 0.9), new Biquad('lowpass', 5000, 0.9)];
  const voices = freqs.flatMap((f) => [-14, -5, 5, 14].map((c) => ({ f: f * 2 ** (c / 1200), ph: rand(), pan: c / 20 })));
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / 0.003) * Math.exp(-tt / (dur * 0.4));
    if (n % 64 === 0) lp.forEach((x) => x.set('lowpass', 800 + 5000 * Math.exp(-tt / 0.08), 0.9));
    let L = 0;
    let R = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const w = saw(v.ph);
      L += w * (1 - v.pan);
      R += w * (1 + v.pan);
    }
    L = (lp[0].process(L) / voices.length) * env * vel * 3;
    R = (lp[1].process(R) / voices.length) * env * vel * 3;
    add(b, s + n, L, R);
    add(send, s + n, L * 0.4, R * 0.4);
  }
}

/** A high, dry tick for the card cuts. */
function tick(b, t, f = 2400, vel = 0.25) {
  const s = Math.round(t * SR);
  for (let n = 0; n < 0.04 * SR; n++) {
    const tt = n / SR;
    const v = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt / 0.008) * vel;
    add(b, s + n, v, v);
  }
}

/** Reverse-crash swell into a downbeat. */
function suck(b, t, dur, vel = 0.3) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 2000, 0.7);
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    const v = hp.process(noise()) * p ** 3 * vel;
    add(b, s + n, v, v);
  }
}

// --- Arrangement -------------------------------------------------------------------------------

function song() {
  const drums = bus(TOTAL);
  const low = bus(TOTAL);
  const music = bus(TOTAL);
  const fx = bus(TOTAL);
  const send = bus(TOTAL);
  const sidechain = new Float32Array(TOTAL).fill(1);
  const duck = (t, depth = 0.6) => {
    const s = Math.round(t * SR);
    for (let n = 0; n < 0.3 * SR && s + n < TOTAL; n++) sidechain[s + n] *= 1 - depth * Math.exp(-n / SR / 0.09);
  };

  /** The main groove: kick on every beat, clap on 2 and 4, 16th hats with rolls, 808 line, offbeat stabs. */
  const groove = (from, to, { stabs = true, hats16 = true } = {}) => {
    for (let beat = from; beat < to; beat++) {
      const t = at(beat);
      const chord = chordAt(beat);
      kick(drums, t, 1);
      duck(t);
      if (beat % 2 === 1) clap(drums, send, t, 0.9);
      for (let k = 0; k < 4; k++) if (hats16 || k % 2 === 0) hat(drums, t + (k * BEAT) / 4, k % 2 ? 0.07 : 0.12);
      if (beat % 4 === 3) for (let k = 0; k < 4; k++) hat(drums, t + BEAT / 2 + (k * BEAT) / 8, 0.08);
      if (beat % 2 === 0) hat(drums, t + BEAT / 2, 0.1, true);
      k808(low, t, chord.root, beat % 4 === 0 ? 0.9 : 0.4, 0.9);
      if (beat % 2 === 1) k808(low, t + BEAT * 0.75, chord.root * (beat % 4 === 3 ? 1.5 : 1), 0.22, 0.7);
      if (stabs) stab(music, send, t + BEAT / 2, chord.notes, 0.13);
    }
  };

  // The question: an 808 and a stab on each word, an impact on "CLIENTS?".
  impact(fx, send, at(0), 0.7);
  k808(low, at(0), PROG[0].root, 0.45, 1);
  stab(music, send, at(0), PROG[0].notes, 0.25);
  k808(low, at(0.5), PROG[0].root, 0.4, 1);
  stab(music, send, at(0.5), PROG[0].notes, 0.25);
  impact(fx, send, at(1), 1);
  k808(low, at(1), PROG[0].root * 0.75, 1, 1);
  stab(music, send, at(1), PROG[0].notes.map((f) => f * 2), 0.3, 0.5);
  suck(fx, at(1.5), BEAT / 2, 0.25);

  // The client roll: half-time, then the ticks double up.
  groove(2, 6, { stabs: false, hats16: false });
  for (let i = 0; i < 4; i++) tick(fx, at(2 + i / 2), 2600);
  for (let i = 0; i < 8; i++) tick(fx, at(4 + i / 4), 3000 + i * 120);
  pad(music, send, at(2), PROG[0].notes, at(4), 0.12, 1400);

  // The build: snare roll in 8ths, 16ths, then 32nds; kicks on 8ths; riser; then silence.
  for (let k = 0; k < 4; k++) clap(drums, send, at(6 + k / 2), 0.5 + k * 0.05);
  for (let k = 0; k < 4; k++) clap(drums, send, at(7 + k / 4), 0.7 + k * 0.05);
  for (let k = 0; k < 6; k++) clap(drums, send, at(7 + 1 / 2 + k / 8), 0.8 + k * 0.03);
  for (let k = 0; k < 6; k++) kick(drums, at(6 + k / 4), 0.6 + k * 0.05);
  riser(fx, send, at(6), at(1.75), 0.35);
  pad(music, send, at(6), PROG[3].notes, at(1.75), 0.13, 2600);

  // THE DROP.
  impact(fx, send, at(8), 1.2);
  stab(music, send, at(8), [...PROG[0].notes, ...PROG[0].notes.map((f) => f * 2)], 0.35, 0.6);
  stab(music, send, at(9), [...PROG[1].notes, ...PROG[1].notes.map((f) => f * 2)], 0.35, 0.6);
  impact(fx, send, at(9), 0.7);
  groove(8, 26);
  pad(music, send, at(8), PROG[0].notes, at(4), 0.1, 3000);
  [0, 1, 2].forEach((k) => bell(music, send, at(10) + k * 0.12, PROG[0].notes[k] * 2, 0.07, k * 0.3 - 0.3));

  // The product: an impact on each title slam, a suck into it.
  for (const beat of [12, 15.5, 19, 22.5]) {
    if (beat > 12) suck(fx, at(beat - 0.5), BEAT / 2, 0.3);
    impact(fx, send, at(beat), 0.55);
    stab(music, send, at(beat), chordAt(beat).notes.map((f) => f * 2), 0.22, 0.3);
  }
  riser(fx, send, at(24), at(2), 0.25);

  // The PAID roll: 16th ticks over the groove, bells on each bar.
  groove(26, 30, { stabs: true });
  for (let i = 0; i < 16; i++) tick(fx, at(26 + i / 4), 2200 + (i % 4) * 300, 0.3);
  [26, 28].forEach((beat) => [0, 1, 2].forEach((k) => bell(music, send, at(beat) + k * 0.1, chordAt(beat).notes[k] * 2, 0.08)));

  // The total.
  impact(fx, send, at(30), 1);
  stab(music, send, at(30), [...PROG[2].notes, ...PROG[2].notes.map((f) => f * 2)], 0.35, 0.6);
  groove(30, 33.5);
  for (let k = 0; k < 4; k++) stab(music, send, at(32 + k / 2), chordAt(32).notes.map((f) => f * 2), 0.22);
  suck(fx, at(33), BEAT, 0.35);

  // End card.
  impact(fx, send, at(34), 1.2);
  stab(music, send, at(34), [...PROG[0].notes, ...PROG[0].notes.map((f) => f * 2)], 0.35, 0.9);
  k808(low, at(34), PROG[0].root, 2.5, 1);
  pad(music, send, at(34), [...PROG[0].notes, 587.33], at(6), 0.18, 3000);
  [0, 0.5, 1, 1.5, 2].forEach((beat, k) => bell(music, send, at(36 + beat), PROG[0].notes[k % 3] * 2, 0.06, k % 2 ? 0.3 : -0.3));

  return mix(drums, low, music, fx, send, sidechain);
}

function mix(drums, low, music, fx, send, sidechain) {
  const wet = reverb(send, 0.84);
  const out = bus(TOTAL);
  const gapFrom = Math.round(at(7.75) * SR);
  const gapTo = Math.round(at(8) * SR);
  for (let n = 0; n < TOTAL; n++) {
    const sc = sidechain[n];
    // The silence before the drop: everything but the riser's reverb tail cuts out.
    const gap = n >= gapFrom && n < gapTo ? 0 : 1;
    for (let ch = 0; ch < 2; ch++) {
      const v = (drums[ch][n] * 0.9 + low[ch][n] * 0.95 + music[ch][n] * sc * 0.8 + fx[ch][n] * 0.8) * gap + wet[ch][n] * 0.45 * (gap ? 1 : 0.3);
      out[ch][n] = Math.tanh(v * 0.9);
    }
  }
  normalize(out, 0.95);
  const fadeStart = (DURATION - 1) * SR;
  for (let n = Math.floor(fadeStart); n < TOTAL; n++) {
    const g = Math.max(0, 1 - (n - fadeStart) / (1 * SR));
    out[0][n] *= g;
    out[1][n] *= g;
  }
  return out;
}

writeWav(path.join(OUT, 'music-reel.wav'), song());
