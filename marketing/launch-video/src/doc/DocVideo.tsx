import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, ScanPay, SignLight } from '../v2/screens';
import { DOC_PRICE_AT, DOC_SHOTS, DROP, FPS, SOURCES, TOTAL_DOC, VO, sec, shotLength, vo, type DocShot } from './timing';

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
const Film: React.FC<{ clip: string; trim?: number; color?: boolean; focus?: string; seed: string }> = ({ clip, trim = 0, color, focus, seed }) => {
  const f = useCurrentFrame();
  const flicker = 1 + (random(`fl${seed}${f}`) - 0.5) * 0.08;
  const grade = color ? `saturate(0.55) sepia(0.25) contrast(1.15) brightness(${flicker})` : `grayscale(1) contrast(1.3) brightness(${flicker * 0.95})`;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ scale: String(interpolate(f, [0, 90], [1.06, 1.16])) }}>
        <OffthreadVideo src={staticFile(`doc/${clip}.mp4`)} trimBefore={trim} muted style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus ?? '50% 50%', filter: grade }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 72%, rgba(0,0,0,0.3) 100%)' }} />
      <Grain opacity={0.35} />
    </AbsoluteFill>
  );
};

/** The narration line, big serif over the picture. */
const Caption: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: `0 ${MARGIN}px`, paddingTop: 640 }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: text.length > 24 ? 132 : 170, lineHeight: 0.98, color: PAPER, textAlign: 'center', textShadow: SHADOW, ...land(f, 1.05), ...lift(f, 0, 26) }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Credit: React.FC<{ source: keyof typeof SOURCES }> = ({ source }) => (
  <div style={{ position: 'absolute', left: MARGIN, top: 200, ...meta(MUTED, 22), textShadow: SHADOW }}>Archive · {SOURCES[source]}</div>
);

const Title: React.FC<{ shot: Extract<DocShot, { kind: 'title' }> }> = ({ shot }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film clip={shot.clip} trim={shot.trim} seed="title" />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 560 }}>
        <div style={{ ...meta(LIME, 28), textShadow: SHADOW, ...lift(f, 4, 12) }}>Invoice Them presents</div>
        <div style={{ fontFamily: SERIF, fontSize: 150, lineHeight: 0.95, color: PAPER, textAlign: 'center', marginTop: 26, textShadow: SHADOW, ...lift(f, 10, 20) }}>
          A short history
          <br />
          <span style={{ fontStyle: 'italic' }}>of getting paid.</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [0, 8], [1, 0], CLAMP) }} />
    </AbsoluteFill>
  );
};

/** "It's 2026. / And you're still waiting?", typed in time with the narration. */
const Typed: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const abs = f + from;
  const typeOut = (text: string, start: number, dur: number) => text.slice(0, Math.floor(interpolate(abs, [start, start + dur], [0, text.length], CLAMP)));
  const y = vo('year');
  const s = vo('still');
  const first = typeOut('It’s 2026.', sec(y.at), sec((y.to - y.from) * 0.8));
  const second = typeOut('And you’re still waiting?', sec(s.at), sec((s.to - s.from) * 0.85));
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: NIGHT, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: SERIF, fontSize: 280, lineHeight: 0.95, color: PAPER }}>
        {first}
        {second === '' && cursor && <span style={{ color: LIME }}>|</span>}
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, lineHeight: 1.02, color: MUTED, marginTop: 30, minHeight: 250 }}>
        {second}
        {second !== '' && cursor && <span style={{ color: LIME }}>|</span>}
      </div>
      <Grain opacity={0.2} />
    </AbsoluteFill>
  );
};

const Anymore: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: NIGHT, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 190, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.92, color: PAPER, transformOrigin: '0% 50%', ...land(f, 1.1) }}>
        Not
        <br />
        <span style={{ color: LIME }}>anymore.</span>
      </div>
      <Grain opacity={0.15} />
    </AbsoluteFill>
  );
};

const Question: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 210, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: INK, transformOrigin: '0% 50%', scale: String(interpolate(f, [0, 60], [1, 1.06])) }}>
        You have
        <br />
        clients?
      </div>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

/** The drop. */
const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const shake = interpolate(f, [0, 10], [1, 0], CLAMP);
  return (
    <AbsoluteFill style={{ background: LIME, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div
        style={{
          fontFamily: BRAND_FONT,
          fontSize: 260,
          fontWeight: 800,
          letterSpacing: '-0.045em',
          lineHeight: 0.9,
          color: INK,
          transformOrigin: '0% 50%',
          translate: `${(random(`ax${f}`) - 0.5) * 30 * shake}px ${(random(`ay${f}`) - 0.5) * 30 * shake}px`,
          ...land(f, 1.35),
        }}
      >
        INVOICE
        <br />
        THEM.
      </div>
      <div style={{ height: 16, background: INK, marginTop: 56, width: `${interpolate(f, [3, 16], [0, 100], { ...CLAMP, easing: EASE_OUT })}%` }} />
      <AbsoluteFill style={{ background: '#FFF', opacity: interpolate(f, [0, 4], [1, 0], CLAMP) }} />
    </AbsoluteFill>
  );
};

const STEPS = ['Create it.', 'Sign it.', 'Send it.', 'Get paid.'];
const STEP_BG = [PAPER, LIME, PAPER, INK];

const AppStep: React.FC<{ step: number }> = ({ step }) => {
  const f = useCurrentFrame();
  const screen = [
    <EditorLight key="c" f={f + 8} adds={[0, 6, 12]} />,
    <SignLight key="s" f={f} drawStart={0} drawEnd={18} doneAt={20} />,
    <ScanPay key="p" f={f + 12} detectAt={0} sheetAt={6} payAt={16} />,
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
        style={{ left: 270, top: 430 + interpolate(f, [0, 10], [140, 0], { ...CLAMP, easing: SPRING }), rotate: `${interpolate(f, [0, 10], [step % 2 ? 5 : -5, 0], { ...CLAMP, easing: EASE_OUT })}deg` }}
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
        <AppMark size={170} style={land(f, 1.3)} />
        <div style={{ marginTop: 60, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 800, height: 800 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 56, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, color: PAPER, ...lift(f, 10) }}>
          You have clients? <span style={{ color: LIME }}>Invoice them.</span>
        </div>
        <div style={{ marginTop: 60, display: 'flex', alignItems: 'baseline', gap: 28, opacity: price >= 0 ? 1 : 0, ...land(price, 1.4) }}>
          <span style={meta(MUTED, 28)}>First month</span>
          <span style={{ fontFamily: FONT, fontSize: 170, fontWeight: 800, letterSpacing: '-0.05em', color: LIME }}>$0.99</span>
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, ...lift(f, DOC_PRICE_AT + 8) }}>
          <div style={{ padding: '24px 52px', borderRadius: 999, background: PAPER, color: INK, fontFamily: FONT, fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED, 22)}>Then $9.99/month · Cancel anytime</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1470, textAlign: 'center', ...lift(f, 20) }}>
        <div style={meta(MUTED, 22)}>
          Powered by <span style={{ color: PAPER, fontWeight: 800 }}>NewMux</span>
        </div>
        <div style={{ ...meta('rgba(244,241,234,0.35)', 15), marginTop: 20, letterSpacing: '0.12em' }}>Archival film: Prelinger Archives, public domain</div>
      </div>
      <Grain opacity={0.1} />
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [len - 12, len], [0, 1], CLAMP) }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const renderShot = (s: DocShot, i: number, len: number) => {
  switch (s.kind) {
    case 'title':
      return <Title shot={s} />;
    case 'film':
      return (
        <AbsoluteFill>
          <Film clip={s.clip} trim={s.trim} color={s.color} focus={s.focus} seed={String(i)} />
          {s.caption && <Caption text={s.caption} />}
          <Credit source={s.source} />
        </AbsoluteFill>
      );
    case 'black':
      return <AbsoluteFill style={{ background: '#000' }} />;
    case 'typed':
      return <Typed from={s.from} />;
    case 'anymore':
      return <Anymore />;
    case 'question':
      return <Question />;
    case 'answer':
      return <Answer />;
    case 'app':
      return <AppStep step={s.step} />;
    case 'end':
      return <EndCard len={len} />;
  }
};

// The music dips under every line, more before the drop than after it.
const VO_SPANS = VO.map((l) => ({ start: sec(l.at), end: sec(l.at + l.to - l.from) }));
const musicVolume = (f: number) => {
  const under = Math.max(0, ...VO_SPANS.map(({ start, end }) => interpolate(f, [start - 4, start, end, end + 8], [0, 1, 1, 0], CLAMP)));
  const post = f >= sec(DROP) - 2;
  const base = post ? 0.85 : 0.6;
  const ducked = post ? 0.28 : 0.26;
  const fade = interpolate(f, [0, 6, TOTAL_DOC - 40, TOTAL_DOC], [0, 1, 1, 0], CLAMP);
  return fade * (base + (ducked - base) * under);
};

export const DocVideo: React.FC<{ music?: boolean }> = ({ music = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    {DOC_SHOTS.map((s, i) => {
      const len = shotLength(i);
      return (
        <Sequence key={i} from={s.from} durationInFrames={len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${'clip' in s ? ` ${s.clip}` : ''}`}>
          {renderShot(s, i, len)}
        </Sequence>
      );
    })}
    {music && <Audio src={staticFile('track/lets-go-from-0m29.wav')} volume={musicVolume} />}
    {VO.map((l) => (
      <Sequence key={l.id} from={sec(l.at)} durationInFrames={sec(l.to - l.from) + 2} name={`vo: ${l.text}`} layout="none">
        <Audio src={staticFile('vo/doc-voiceover.mp3')} trimBefore={Math.round(l.from * FPS)} trimAfter={Math.round(l.to * FPS)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
