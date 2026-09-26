// Tiny DSP toolkit for the synthesized soundtracks: filters, buses, reverb, delay, WAV output.
import fs from 'node:fs';

export const SR = 44100;

let seed = 20260926;
export const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
export const noise = () => rand() * 2 - 1;
export const saw = (phase) => 2 * (phase - Math.floor(phase)) - 1;

export class Biquad {
  constructor(type = 'lowpass', freq = 1000, q = 0.707) {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(type, freq, q);
  }
  set(type, freq, q) {
    const w = (2 * Math.PI * Math.min(Math.max(freq, 10), SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === 'lowpass') [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === 'highpass') [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha];
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cs) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export const bus = (n) => [new Float32Array(n), new Float32Array(n)];
export const add = (b, i, l, r = l) => {
  if (i >= 0 && i < b[0].length) {
    b[0][i] += l;
    b[1][i] += r;
  }
};

/** Freeverb-style reverb: 4 damped combs + 2 allpasses per channel. `size` 0..1 lengthens the tail. */
export function reverb(input, size = 0.86) {
  const out = bus(input[0].length);
  for (let ch = 0; ch < 2; ch++) {
    const spread = ch * 23;
    const x = input[ch];
    const y = out[ch];
    for (const len of [1116, 1188, 1277, 1356, 1422, 1491]) {
      const buf = new Float32Array(len + spread);
      let idx = 0;
      let store = 0;
      for (let n = 0; n < x.length; n++) {
        const o = buf[idx];
        store = o * 0.6 + store * 0.4;
        buf[idx] = x[n] * 0.012 + store * size;
        idx = (idx + 1) % buf.length;
        y[n] += o;
      }
    }
    for (const len of [556, 441, 341]) {
      const buf = new Float32Array(len + spread);
      let idx = 0;
      for (let n = 0; n < y.length; n++) {
        const b = buf[idx];
        const o = -y[n] + b;
        buf[idx] = y[n] + b * 0.5;
        idx = (idx + 1) % buf.length;
        y[n] = o;
      }
    }
  }
  return out;
}

export function pingPong(input, time, feedback, mix) {
  const d = Math.round(time * SR);
  const [L, R] = input;
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  let idx = 0;
  for (let n = 0; n < L.length; n++) {
    const dl = bl[idx];
    const dr = br[idx];
    bl[idx] = L[n] * 0.5 + dr * feedback;
    br[idx] = R[n] * 0.5 + dl * feedback;
    idx = (idx + 1) % d;
    L[n] += dl * mix;
    R[n] += dr * mix;
  }
}

export function normalize(b, target = 0.9) {
  let peak = 0;
  for (const ch of b) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const g = target / (peak || 1);
  for (const ch of b) for (let i = 0; i < ch.length; i++) ch[i] *= g;
  return b;
}

export function writeWav(file, [L, R]) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file.split('/').pop()} (${(n / SR).toFixed(2)} s)`);
}
