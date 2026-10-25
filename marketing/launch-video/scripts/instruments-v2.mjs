// The v2 instrument rack, shared by the launch video v2 soundtrack (make-music-v2.mjs) and the
// 15 s ad's (make-music-ad.mjs). Each instrument adds one note into a stereo bus (and a reverb send).

import { Biquad, SR, add, noise, rand, saw } from './synth.mjs';

/** F major: Fmaj7 · Dm9 · B♭maj7 · C6. */
export const CHORDS = [
  { root: 43.65, notes: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
  { root: 73.42, notes: [146.83, 174.61, 220.0, 261.63, 329.63] }, // Dm9
  { root: 58.27, notes: [116.54, 146.83, 174.61, 220.0] }, // B♭maj7
  { root: 65.41, notes: [130.81, 164.81, 196.0, 220.0] }, // C6
];

export function kick(b, t, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.4 * SR; n++) {
    const tt = n / SR;
    ph += (48 + 70 * Math.exp(-tt / 0.028)) / SR;
    const v = Math.tanh(Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.22) * Math.min(1, tt / 0.002) * 1.3) * 0.85 * vel;
    add(b, s + n, v, v);
  }
}

export function snap(b, send, t, vel = 1) {
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

export function shaker(b, t, vel = 0.08) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 6000, 0.7);
  for (let n = 0; n < 0.09 * SR; n++) {
    const tt = n / SR;
    const env = Math.min(1, tt / 0.012) * Math.exp(-tt / 0.03);
    const v = hp.process(noise()) * env * vel;
    add(b, s + n, v * 0.7, v * 1.2);
  }
}

export function bass(b, t, f, dur, vel = 0.42) {
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

export function marimba(b, send, t, f, vel = 0.16, pan = 0) {
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

export function bell(b, send, t, f, vel = 0.08, pan = 0) {
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

export function pad(b, send, t, freqs, dur, vel, cutoff) {
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

export function swell(b, send, t, dur, vel = 0.18) {
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

export function softHit(b, send, t, vel = 0.7) {
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
