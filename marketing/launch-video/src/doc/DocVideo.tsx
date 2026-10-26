import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, ScanPay, SignLight } from '../v2/screens';
import { BEAT, DOC_PRICE_AT, DOC_SHOTS, DOC_STARTS, SOURCES, type DocShot } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const { midnight: INK, lime: LIME, paper: PAPER } = BRAND;
const NIGHT = '#08070F';
const MUTED = 'rgba(244,241,234,0.6)';
const SERIF = '"Instrument Serif", Georgia, serif';
const MARGIN = 80;
const SHADOW = '0 4px 30px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.6)';

const meta = (color: string, size = 24): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color,
});

/** Lands on the cut: a hair oversized, settling in three frames. */
const land = (f: number, from = 1.12): React.CSSProperties => ({
  scale: String(interpolate(f, [0, 3], [from, 1], { ...CLAMP, easing: EASE_OUT })),
});

const lift = (f: number, at: number, dy = 24): React.CSSProperties => ({
  opacity: interpolate(f, [at, at + 6], [0, 1], CLAMP),
  translate: `0px ${interpolate(f, [at, at + 12], [dy, 0], { ...CLAMP, easing: EASE_OUT })}px`,
});

/** Film grain: a fresh noise field every frame. */
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id={`grain${f}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${f})`} />
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------

/** Archival film, full frame: graded, pushed in, flickering, with grain and a heavy vignette. */
const FilmShot: React.FC<{ shot: Extract<DocShot, { kind: 'film' }> }> = ({ shot }) => {
  const f = useCurrentFrame();
  const flicker = 1 + (random(`fl${shot.clip}${f}`) - 0.5) * 0.08;
  const grade = shot.color ? `saturate(0.55) sepia(0.25) contrast(1.15) brightness(${flicker})` : `grayscale(1) contrast(1.3) brightness(${flicker * 0.95})`;
  const flash = shot.flash ? interpolate(f, [0, 2], [0.7, 0], CLAMP) : 0;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ scale: String(interpolate(f, [0, 60], [1.06, 1.14])) }}>
        <OffthreadVideo
          src={staticFile(`doc/${shot.clip}.mp4`)}
          trimBefore={shot.trim ?? 0}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: shot.focus ?? '50% 50%', filter: grade }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.25) 100%)' }} />
      <Grain opacity={0.35} />

      {shot.line && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: `0 ${MARGIN}px`, paddingTop: 620 }}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 200, lineHeight: 0.95, color: PAPER, textAlign: 'center', textShadow: SHADOW, ...land(f, 1.06), ...lift(f, 0, 30) }}>
            {shot.line}
          </div>
        </AbsoluteFill>
      )}
      {shot.word && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 560 }}>
          <div style={{ fontFamily: BRAND_FONT, fontWeight: 800, fontSize: 210, letterSpacing: '-0.045em', color: PAPER, textShadow: SHADOW, whiteSpace: 'nowrap', ...land(f) }}>{shot.word}</div>
        </AbsoluteFill>
      )}

      <div style={{ position: 'absolute', left: MARGIN, top: 200, ...meta(MUTED, 22), textShadow: SHADOW }}>Archive · {SOURCES[shot.source]}</div>
      <AbsoluteFill style={{ background: '#FFF', opacity: flash }} />
    </AbsoluteFill>
  );
};

/** The year, typed out on black. */
const TYPED = ['It’s 2026.', 'You’re still waiting.'];
const Typed: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(f / 1.2);
  const first = TYPED[0].slice(0, chars);
  const second = TYPED[1].slice(0, Math.max(0, chars - TYPED[0].length - 4));
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: NIGHT, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: SERIF, fontSize: 280, lineHeight: 0.95, color: PAPER }}>
        {first}
        {second === '' && cursor && <span style={{ color: LIME }}>|</span>}
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 130, lineHeight: 1.05, color: MUTED, marginTop: 30, minHeight: 140 }}>
        {second}
        {second !== '' && cursor && <span style={{ color: LIME }}>|</span>}
      </div>
      <Grain opacity={0.2} />
    </AbsoluteFill>
  );
};

const Question: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 210, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: INK, transformOrigin: '0% 50%', ...land(f, 1.08) }}>
        You have
        <br />
        clients?
      </div>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

const Answer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: LIME, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 250, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.92, color: INK, transformOrigin: '0% 50%', ...land(f, 1.25) }}>
        Invoice
        <br />
        them.
      </div>
      <div style={{ height: 14, background: INK, marginTop: 56, width: `${interpolate(f, [4, 20], [0, 100], { ...CLAMP, easing: EASE_OUT })}%` }} />
      <AbsoluteFill style={{ background: '#FFF', opacity: interpolate(f, [0, 3], [0.9, 0], CLAMP) }} />
    </AbsoluteFill>
  );
};

const STEPS = ['Create it.', 'Sign it.', 'Send it.', 'Get paid.'];
const STEP_BG = [PAPER, LIME, PAPER, INK];

/** The app, one step per two beats. */
const AppStep: React.FC<{ step: number }> = ({ step }) => {
  const f = useCurrentFrame();
  const screen = [
    <EditorLight key="c" f={f + 8} adds={[0, 7, 14]} />,
    <SignLight key="s" f={f} drawStart={0} drawEnd={20} doneAt={22} />,
    <ScanPay key="p" f={f + 12} detectAt={0} sheetAt={6} payAt={18} />,
    <DetailLight key="d" f={f} paidAt={2} />,
  ][step];
  const dark = STEP_BG[step] === INK;
  return (
    <AbsoluteFill style={{ background: STEP_BG[step] }}>
      <div style={{ position: 'absolute', left: MARGIN, top: 220, display: 'flex', alignItems: 'baseline', gap: 26 }}>
        <span style={meta(dark ? MUTED : 'rgba(18,17,43,0.55)', 26)}>{String(step + 1).padStart(2, '0')} / 04</span>
        <span style={{ fontFamily: BRAND_FONT, fontSize: 120, fontWeight: 800, letterSpacing: '-0.045em', color: dark ? LIME : INK, ...land(f) }}>{STEPS[step]}</span>
      </div>
      <Phone
        width={540}
        lightScreen
        shadow="0 60px 110px rgba(0,0,0,0.3)"
        style={{ left: 270, top: 430 + interpolate(f, [0, 10], [120, 0], { ...CLAMP, easing: SPRING }), rotate: `${interpolate(f, [0, 10], [step % 2 ? 4 : -4, 0], { ...CLAMP, easing: EASE_OUT })}deg` }}
      >
        {screen}
      </Phone>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [2, 14], [0, 100], { ...CLAMP, easing: EASE_OUT });
  const price = f - DOC_PRICE_AT;
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 290 }}>
        <AppMark size={170} style={{ ...land(f, 1.3) }} />
        <div style={{ marginTop: 60, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 800, height: 800 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 56, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: PAPER, ...lift(f, 10) }}>
          You have clients? <span style={{ color: LIME }}>Invoice them.</span>
        </div>
        <div style={{ marginTop: 60, display: 'flex', alignItems: 'baseline', gap: 28, opacity: price >= 0 ? 1 : 0, ...land(price, 1.4) }}>
          <span style={meta(MUTED, 28)}>First month</span>
          <span style={{ fontFamily: FONT, fontSize: 160, fontWeight: 800, letterSpacing: '-0.05em', color: LIME }}>$0.99</span>
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, ...lift(f, DOC_PRICE_AT + 8) }}>
          <div style={{ padding: '24px 52px', borderRadius: 999, background: PAPER, color: INK, fontFamily: FONT, fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED, 22)}>Then $9.99/month · Cancel anytime</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1470, textAlign: 'center', ...lift(f, BEAT) }}>
        <div style={meta(MUTED, 22)}>
          Powered by <span style={{ color: PAPER, fontWeight: 800 }}>NewMux</span>
        </div>
        <div style={{ ...meta('rgba(244,241,234,0.35)', 15), marginTop: 20, letterSpacing: '0.12em' }}>Archival film: Prelinger Archives, public domain</div>
      </div>
      <Grain opacity={0.1} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [len - 10, len], [0, 1], CLAMP) }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const renderShot = (s: DocShot) => {
  switch (s.kind) {
    case 'film':
      return <FilmShot shot={s} />;
    case 'gap':
      return <AbsoluteFill style={{ background: '#000' }} />;
    case 'typed':
      return <Typed />;
    case 'question':
      return <Question />;
    case 'answer':
      return <Answer />;
    case 'app':
      return <AppStep step={s.step} />;
    case 'end':
      return <EndCard len={s.len} />;
  }
};

export const DocVideo: React.FC<{ music?: boolean }> = ({ music = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    {DOC_SHOTS.map((s, i) => (
      <Sequence key={i} from={DOC_STARTS[i]} durationInFrames={s.len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${s.kind === 'film' ? ` ${s.clip}` : ''}`}>
        {renderShot(s)}
      </Sequence>
    ))}
    {music && <Audio src={staticFile('audio/music-doc.wav')} />}
  </AbsoluteFill>
);
