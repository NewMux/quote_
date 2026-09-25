// Synthesizes the launch video's original soundtrack and sound effects: no samples, no licensed
// material, so the video is safe to post anywhere. Run `npm run music`; writes WAVs to public/audio.
//
// 120 BPM in A minor (Am–F–C–G), 16 bars = 32 s, arranged to match src/timing.ts:
//   bars 1–2 intro (filtered pad, hats, riser) · bar 3 drop · bars 4–11 groove ·
//   bars 12–13 breakdown + build · bars 14–15 final drop · bar 16 impact and tail.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const SR = 44100;
const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const BARS = 16;
const DURATION = BARS * BAR;

// Deterministic noise, so every run produces the identical file.
let seed = 20260925;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

class Biquad {
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

const bus = (n) => [new Float32Array(n), new Float32Array(n)];
const add = (b, i, l, r = l) => {
  if (i >= 0 && i < b[0].length) {
    b[0][i] += l;
    b[1][i] += r;
  }
};
const saw = (phase) => 2 * (phase - Math.floor(phase)) - 1;

// ---------------------------------------------------------------------------------------------
// Instruments. Each writes into a bus starting at time `t` (seconds).

function kick(b, t, vel = 1) {
  const s = Math.round(t * SR);
  let ph = 0;
  for (let n = 0; n < 0.45 * SR; n++) {
    const tt = n / SR;
    ph += (45 + 110 * Math.exp(-tt / 0.03)) / SR;
    let v = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.26) * Math.min(1, tt / 0.001);
    if (tt < 0.004) v += noise() * 0.35 * (1 - tt / 0.004);
    v = Math.tanh(v * 1.8) * 0.95 * vel;
    add(b, s + n, v, v);
  }
}

function clap(b, send, t, vel = 1) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 1400, 0.8);
  const hp = new Biquad('highpass', 700, 0.7);
  for (let n = 0; n < 0.4 * SR; n++) {
    const tt = n / SR;
    let env = 0;
    for (const [offset, decay] of [
      [0, 0.007],
      [0.012, 0.007],
      [0.024, 0.14],
    ]) {
      if (tt >= offset) env = Math.max(env, Math.exp(-(tt - offset) / decay));
    }
    const v = hp.process(bp.process(noise())) * env * 2.2 * vel;
    add(b, s + n, v * 0.95, v);
    add(send, s + n, v * 0.3, v * 0.3);
  }
}

function hat(b, t, vel = 0.25, open = false, pan = 0.25) {
  const s = Math.round(t * SR);
  const hp = new Biquad('highpass', 7500, 0.7);
  const decay = open ? 0.08 : 0.016;
  for (let n = 0; n < (open ? 0.3 : 0.06) * SR; n++) {
    const v = hp.process(noise()) * Math.exp(-n / SR / decay) * vel;
    add(b, s + n, v * (1 - pan), v * (1 + pan));
  }
}

function bassNote(b, t, freq, dur, vel = 0.5) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 380, 0.9);
  let p1 = 0;
  let p2 = 0;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    p1 += freq / SR;
    p2 += (freq * 2) / SR;
    const env = Math.min(1, tt / 0.004) * Math.min(1, (dur - tt) / 0.02) * (0.7 + 0.3 * Math.exp(-tt / 0.08));
    const v = (Math.sin(2 * Math.PI * p1) * 0.9 + lp.process(saw(p2)) * 0.35) * env * vel;
    add(b, s + n, v, v);
  }
}

function pluck(b, send, t, freq, vel = 0.16, pan = 0, bright = 1) {
  const s = Math.round(t * SR);
  const lp = new Biquad();
  const phases = [rand(), rand()];
  const detune = [1, 1.007];
  for (let n = 0; n < 0.4 * SR; n++) {
    const tt = n / SR;
    if (n % 32 === 0) lp.set('lowpass', 350 + 5200 * bright * Math.exp(-tt / 0.06), 1.4);
    let v = 0;
    for (let k = 0; k < 2; k++) {
      phases[k] += (freq * detune[k]) / SR;
      v += saw(phases[k]);
    }
    v = lp.process(v * 0.5) * Math.exp(-tt / 0.15) * Math.min(1, tt / 0.002) * vel;
    add(b, s + n, v * (1 - pan), v * (1 + pan));
    add(send, s + n, v * 0.35, v * 0.35);
  }
}

function pad(b, send, t, freqs, dur, vel, cutoffAt) {
  const s = Math.round(t * SR);
  const filters = [new Biquad(), new Biquad()];
  const voices = [];
  for (const f of freqs) {
    for (const cents of [-11, 0, 11]) voices.push({ f: f * 2 ** (cents / 1200), ph: rand(), pan: cents / 30 });
  }
  const norm = 3 / voices.length;
  for (let n = 0; n < dur * SR; n++) {
    const tt = n / SR;
    if (n % 64 === 0) {
      const c = cutoffAt(t + tt);
      filters[0].set('lowpass', c, 0.8);
      filters[1].set('lowpass', c, 0.8);
    }
    const env = Math.min(1, tt / 0.12) * Math.min(1, Math.max(0, dur - tt) / 0.25);
    let L = 0;
    let R = 0;
    for (const v of voices) {
      v.ph += v.f / SR;
      const w = saw(v.ph);
      L += w * (1 - v.pan);
      R += w * (1 + v.pan);
    }
    L = filters[0].process(L) * env * vel * norm;
    R = filters[1].process(R) * env * vel * norm;
    add(b, s + n, L, R);
    add(send, s + n, L * 0.45, R * 0.45);
  }
}

function riser(b, send, t, dur, vel = 0.22) {
  const s = Math.round(t * SR);
  const bp = new Biquad('bandpass', 400, 1.2);
  for (let n = 0; n < dur * SR; n++) {
    const p = n / (dur * SR);
    if (n % 32 === 0) bp.set('bandpass', 350 * 25 ** p, 1.2);
    const v = bp.process(noise()) * p ** 2 * vel * 3;
    add(b, s + n, v * (1 - p * 0.4), v * (0.6 + p * 0.4));
    add(send, s + n, v * 0.4, v * 0.4);
  }
}

function snareRoll(b, send, t, dur) {
  // 8ths, then 16ths, then 32nds, rising in volume: the classic pre-drop build.
  const steps = [
    [0, BEAT / 2],
    [dur * 0.5, BEAT / 4],
    [dur * 0.8, BEAT / 8],
  ];
  for (let i = 0; i < steps.length; i++) {
    const [start, step] = steps[i];
    const end = i + 1 < steps.length ? steps[i + 1][0] : dur;
    for (let x = start; x < end - 1e-6; x += step) clap(b, send, t + x, 0.25 + 0.55 * (x / dur));
  }
}

function impact(b, send, t, vel = 1) {
  const s = Math.round(t * SR);
  const lp = new Biquad('lowpass', 2200, 0.7);
  let ph = 0;
  for (let n = 0; n < 2.2 * SR; n++) {
    const tt = n / SR;
    ph += (28 + 70 * Math.exp(-tt / 0.25)) / SR;
    let v = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.9) * 0.9;
    v += lp.process(noise()) * Math.exp(-tt / 0.18) * 0.6;
    v = Math.tanh(v * 1.5) * vel;
    add(b, s + n, v, v);
    add(send, s + n, v * 0.5, v * 0.5);
  }
}

function sparkle(b, send, t, vel = 0.1) {
  // A quick high arpeggio shimmer (A major-ish bells) for the logo reveal.
  [1760, 2217.46, 2637.02, 3520].forEach((f, i) => {
    const s = Math.round((t + i * 0.045) * SR);
    for (let n = 0; n < 0.9 * SR; n++) {
      const tt = n / SR;
      const v =
        (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * tt)) *
        Math.exp(-tt / 0.3) *
        Math.min(1, tt / 0.002) *
        vel;
      const pan = (i / 3) * 0.8 - 0.4;
      add(b, s + n, v * (1 - pan), v * (1 + pan));
      add(send, s + n, v * 0.5, v * 0.5);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Effects.

function reverb(input) {
  // A compact Freeverb: 4 damped combs + 2 allpasses per channel.
  const out = bus(input[0].length);
  const combs = [1116, 1188, 1277, 1356];
  const allpasses = [556, 441];
  for (let ch = 0; ch < 2; ch++) {
    const spread = ch * 23;
    const x = input[ch];
    const y = out[ch];
    for (const len of combs) {
      const buf = new Float32Array(len + spread);
      let idx = 0;
      let store = 0;
      for (let n = 0; n < x.length; n++) {
        const o = buf[idx];
        store = o * 0.7 + store * 0.3;
        buf[idx] = x[n] * 0.015 + store * 0.86;
        idx = (idx + 1) % buf.length;
        y[n] += o;
      }
    }
    for (const len of allpasses) {
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

function pingPong(input, time, feedback, mix) {
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

// ---------------------------------------------------------------------------------------------
// Arrangement.

const CHORDS = [
  { bass: 55.0, notes: [220.0, 261.63, 329.63] }, // Am
  { bass: 43.65, notes: [174.61, 220.0, 261.63] }, // F
  { bass: 65.41, notes: [261.63, 329.63, 392.0] }, // C
  { bass: 49.0, notes: [196.0, 246.94, 293.66] }, // G
];

const section = (bar) =>
  bar < 2 ? 'intro' : bar < 11 ? 'main' : bar < 13 ? 'break' : bar < 15 ? 'final' : 'outro';

function renderSong() {
  const total = Math.ceil((DURATION + 0.01) * SR);
  const drums = bus(total);
  const bass = bus(total);
  const synths = bus(total);
  const plucks = bus(total);
  const fx = bus(total);
  const send = bus(total);
  const sidechain = new Float32Array(total).fill(1);

  const duck = (t, depth = 0.7) => {
    const s = Math.round(t * SR);
    for (let n = 0; n < 0.3 * SR && s + n < total; n++) sidechain[s + n] *= 1 - depth * Math.exp(-n / SR / 0.08);
  };

  // Pad cutoff: closed in the intro, opening into the drop; darker in the breakdown.
  const cutoff = (t) => {
    if (t < 2 * BAR) return 350 + 1650 * (t / (2 * BAR)) ** 2;
    if (t < 11 * BAR) return 2200;
    if (t < 13 * BAR) return 900 + 1400 * ((t - 11 * BAR) / (2 * BAR));
    return 2600;
  };

  for (let bar = 0; bar < BARS; bar++) {
    const t0 = bar * BAR;
    const sec = section(bar);
    const chord = CHORDS[bar % 4];

    if (sec === 'outro') {
      pad(synths, send, t0, [...CHORDS[0].notes, 440], BAR + 0.2, 0.2, () => 2400);
      bassNote(bass, t0, 55, 1.6, 0.45);
      continue;
    }

    pad(synths, send, t0, chord.notes, BAR + 0.05, sec === 'intro' ? 0.2 : sec === 'break' ? 0.24 : 0.14, cutoff);

    for (let beat = 0; beat < 4; beat++) {
      const tb = t0 + beat * BEAT;
      const drumsOn = sec === 'main' || sec === 'final';

      if (drumsOn) {
        kick(drums, tb, bar === 2 && beat === 0 ? 1.1 : 1);
        duck(tb);
        if (beat % 2 === 1) clap(drums, send, tb, 0.8);
        hat(drums, tb + BEAT / 2, 0.2, true, 0.2);
        hat(drums, tb + BEAT / 4, 0.09, false, -0.3);
        hat(drums, tb + (3 * BEAT) / 4, 0.09, false, -0.3);
        // Offbeat bass: the pumping house groove.
        bassNote(bass, tb + BEAT / 2, beat === 3 ? chord.bass * 2 : chord.bass, BEAT / 2 - 0.02, 0.5);
      } else if (sec === 'intro' && bar === 1) {
        hat(drums, tb + BEAT / 2, 0.12, false, 0.2);
      } else if (sec === 'break' && beat === 2) {
        clap(drums, send, tb, 0.5);
      }

      // 16th-note arpeggio across the chord, an octave up.
      if (sec !== 'intro') {
        const pattern = [0, 1, 2, 1];
        for (let s16 = 0; s16 < 4; s16++) {
          const idx = pattern[(beat * 4 + s16) % 4];
          const octave = s16 === 3 && beat % 2 === 1 ? 4 : 2;
          const bright = sec === 'break' ? 0.5 : sec === 'final' ? 1.2 : 0.9;
          pluck(plucks, send, tb + (s16 * BEAT) / 4, chord.notes[idx] * octave, sec === 'final' ? 0.17 : 0.13, s16 % 2 ? 0.3 : -0.3, bright);
        }
      }
    }
  }

  // Builds, drops and hits (seconds).
  riser(fx, send, 0.5 * BAR, 1.45 * BAR, 0.2);
  snareRoll(drums, send, 1.5 * BAR, 0.45 * BAR);
  impact(fx, send, 2 * BAR, 0.9);
  sparkle(fx, send, 2 * BAR + 0.05, 0.08);
  riser(fx, send, 11.5 * BAR, 1.45 * BAR, 0.26);
  snareRoll(drums, send, 12.5 * BAR, 0.45 * BAR);
  impact(fx, send, 13 * BAR, 1);
  impact(fx, send, 15 * BAR, 1.1);
  sparkle(fx, send, 15 * BAR + 0.05, 0.09);

  pingPong(plucks, BEAT * 0.75, 0.35, 0.45);
  const wet = reverb(send);

  // Mix, glue with a soft clipper, normalize, and fade the tail.
  const out = bus(total);
  let peak = 0;
  for (let n = 0; n < total; n++) {
    const sc = sidechain[n];
    for (let ch = 0; ch < 2; ch++) {
      let v =
        drums[ch][n] * 0.9 +
        bass[ch][n] * sc * 0.95 +
        synths[ch][n] * sc * 0.8 +
        plucks[ch][n] * sc * 0.75 +
        fx[ch][n] * 0.8 +
        wet[ch][n] * 0.55;
      v = Math.tanh(v * 1.15);
      out[ch][n] = v;
      peak = Math.max(peak, Math.abs(v));
    }
  }
  const gain = 0.93 / peak;
  const fadeStart = (DURATION - 0.6) * SR;
  for (let n = 0; n < total; n++) {
    const fade = n > fadeStart ? Math.max(0, 1 - (n - fadeStart) / (0.6 * SR)) : 1;
    out[0][n] *= gain * fade;
    out[1][n] *= gain * fade;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Sound effects (placed on the timeline by the video).

function sfx(duration, fn) {
  const b = bus(Math.ceil(duration * SR));
  fn(b);
  let peak = 0;
  for (const ch of b) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  for (const ch of b) for (let i = 0; i < ch.length; i++) ch[i] = (ch[i] / (peak || 1)) * 0.9;
  return b;
}

const whoosh = () =>
  sfx(0.55, (b) => {
    const bp = new Biquad('bandpass', 500, 0.9);
    const len = b[0].length;
    for (let n = 0; n < len; n++) {
      const p = n / len;
      if (n % 32 === 0) bp.set('bandpass', 400 * 12 ** p, 0.9);
      const v = bp.process(noise()) * Math.sin(Math.PI * p) ** 2;
      add(b, n, v * (1 - p), v * p);
    }
  });

const tap = () =>
  sfx(0.08, (b) => {
    for (let n = 0; n < b[0].length; n++) {
      const tt = n / SR;
      const v = Math.sin(2 * Math.PI * 1900 * tt) * Math.exp(-tt / 0.012) + noise() * Math.exp(-tt / 0.002) * 0.3;
      add(b, n, v, v);
    }
  });

const pop = () =>
  sfx(0.15, (b) => {
    let ph = 0;
    for (let n = 0; n < b[0].length; n++) {
      const tt = n / SR;
      ph += (420 + 900 * Math.min(1, tt / 0.035)) / SR;
      const v = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.045) * Math.min(1, tt / 0.001);
      add(b, n, v, v);
    }
  });

const chime = () =>
  sfx(1.4, (b) => {
    [
      [0, 1318.51],
      [0.09, 1975.53],
      [0.18, 2637.02],
    ].forEach(([offset, f]) => {
      const s = Math.round(offset * SR);
      for (let n = 0; n < b[0].length - s; n++) {
        const tt = n / SR;
        const v =
          (Math.sin(2 * Math.PI * f * tt) + 0.25 * Math.sin(2 * Math.PI * f * 3.01 * tt) * Math.exp(-tt / 0.05)) *
          Math.exp(-tt / 0.4) *
          Math.min(1, tt / 0.003);
        add(b, s + n, v, v);
      }
    });
  });

const pen = () =>
  sfx(1.2, (b) => {
    const bp = new Biquad('bandpass', 2600, 1.6);
    for (let n = 0; n < b[0].length; n++) {
      const tt = n / SR;
      // Scribble: rhythmic strokes of filtered noise.
      const stroke = 0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * tt) * Math.sin(2 * Math.PI * 2.3 * tt);
      const env = Math.min(1, tt / 0.05) * Math.min(1, (1.2 - tt) / 0.15);
      const v = bp.process(noise()) * stroke * env;
      add(b, n, v, v);
    }
  });

// ---------------------------------------------------------------------------------------------

function writeWav(file, [L, R]) {
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
  fs.writeFileSync(path.join(OUT_DIR, file), buf);
  console.log(`wrote ${file} (${(n / SR).toFixed(2)} s)`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav('music.wav', renderSong());
writeWav('whoosh.wav', whoosh());
writeWav('tap.wav', tap());
writeWav('pop.wav', pop());
writeWav('chime.wav', chime());
writeWav('pen.wav', pen());
