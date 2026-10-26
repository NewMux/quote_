import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, ScanPay, SignLight } from '../v2/screens';
import { DOC_PRICE_AT, DOC_SHOTS, DOC_STARTS, type DocShot } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const { midnight: INK, lime: LIME, paper: PAPER } = BRAND;
const NIGHT = '#0B0A16';
const MUTED = 'rgba(244,241,234,0.5)';
const SERIF = '"Instrument Serif", Georgia, serif';
const MARGIN = 80;

const meta = (color: string, size = 24): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color,
});

const serif = (size: number, color: string = PAPER, italic = false): React.CSSProperties => ({
  fontFamily: SERIF,
  fontSize: size,
  fontStyle: italic ? 'italic' : 'normal',
  fontWeight: 400,
  lineHeight: 1.08,
  letterSpacing: '-0.01em',
  color,
});

/** Fades and lifts in. */
const lift = (f: number, at: number, dy = 18): React.CSSProperties => ({
  opacity: interpolate(f, [at, at + 10], [0, 1], CLAMP),
  translate: `0px ${interpolate(f, [at, at + 16], [dy, 0], { ...CLAMP, easing: EASE_OUT })}px`,
});

/** Film grain: a fresh noise field every frame, laid over the picture. */
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => {
  const f = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id={`grain${f}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${f})`} />
    </svg>
  );
};

/** The page every documentary shot sits on: near-black, grain, the series line up top. */
const Page: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = NIGHT }) => (
  <AbsoluteFill style={{ background: bg }}>
    {children}
    <Grain opacity={0.14} />
  </AbsoluteFill>
);

const Masthead: React.FC<{ dark?: boolean }> = ({ dark = true }) => (
  <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 180, display: 'flex', justifyContent: 'space-between' }}>
    <span style={meta(dark ? MUTED : 'rgba(18,17,43,0.55)')}>A short history of getting paid</span>
    <span style={meta(dark ? MUTED : 'rgba(18,17,43,0.55)')}>Invoice Them</span>
  </div>
);

// ---------------------------------------------------------------------------------------------

/** A 4:3 archival plate: graded, slowly pushed in, with flicker, gate weave, grain and vignette. */
const FilmPlate: React.FC<{ clip: string; trim?: number; color?: boolean; len: number }> = ({ clip, trim = 0, color, len }) => {
  const f = useCurrentFrame();
  const flicker = 1 + (random(`fl${clip}${f}`) - 0.5) * 0.06;
  const weaveX = Math.sin(f * 0.9) * 0.8 + (random(`wx${clip}${f}`) - 0.5) * 1.2;
  const weaveY = Math.cos(f * 0.7) * 0.8 + (random(`wy${clip}${f}`) - 0.5) * 1.2;
  const grade = color ? `saturate(0.62) sepia(0.18) contrast(1.06) brightness(${flicker})` : `grayscale(1) contrast(1.12) brightness(${flicker})`;
  return (
    <div style={{ position: 'absolute', left: 0, top: 440, width: 1080, height: 810, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, scale: String(interpolate(f, [0, len], [1.02, 1.08])), translate: `${weaveX}px ${weaveY}px` }}>
        <OffthreadVideo src={staticFile(`doc/${clip}.mp4`)} trimBefore={trim} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: grade }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      <Grain opacity={0.3} />
    </div>
  );
};

const FilmShot: React.FC<{ shot: Extract<DocShot, { kind: 'film' }> }> = ({ shot }) => {
  const f = useCurrentFrame();
  const fadeIn = shot.chapter ? interpolate(f, [0, 6], [1, 0], CLAMP) : 0;
  return (
    <Page>
      <Masthead />
      {shot.chapter && (
        <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 250, display: 'flex', alignItems: 'baseline', gap: 26, ...lift(f, 2, 12) }}>
          <span style={serif(150, PAPER, true)}>{shot.chapter.year}</span>
          <span style={meta(LIME, 26)}>
            {shot.chapter.numeral}. {shot.chapter.title}
          </span>
        </div>
      )}
      <FilmPlate clip={shot.clip} trim={shot.trim} color={shot.color} len={shot.len} />
      <div style={{ position: 'absolute', right: MARGIN, top: 1268, ...meta(MUTED, 18) }}>
        {shot.source} · Prelinger Archives
      </div>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 1330, ...serif(74), ...lift(f, 6) }}>{shot.caption}</div>
      <AbsoluteFill style={{ background: '#000', opacity: fadeIn }} />
    </Page>
  );
};

/** Cold open: Franklin, 1748. */
const Quote: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  return (
    <Page>
      <div style={{ position: 'absolute', left: 190, top: 250, width: 700, height: 862, overflow: 'hidden' }}>
        <Img
          src={staticFile('doc/franklin.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f, [0, len], [1.0, 1.07])), filter: 'grayscale(0.35) contrast(1.05) brightness(0.92)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 50%, rgba(11,10,22,0.7) 100%)' }} />
        <Grain opacity={0.25} />
      </div>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 1180, textAlign: 'center' }}>
        <div style={{ ...serif(92, PAPER, true), ...lift(f, 10) }}>“Remember that credit is money.”</div>
        <div style={{ ...meta(MUTED, 24), marginTop: 40, ...lift(f, 30) }}>Benjamin Franklin</div>
        <div style={{ ...meta(MUTED, 20), marginTop: 12, ...lift(f, 34) }}>Advice to a Young Tradesman, 1748</div>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [0, 12], [1, 0], CLAMP) }} />
    </Page>
  );
};

/** Back to today. */
const Now: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Page>
      <Masthead />
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 640 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, ...lift(f, 0, 12) }}>
          <span style={serif(150, PAPER, true)}>Today</span>
          <span style={meta(LIME, 26)}>IV. The job after the job</span>
        </div>
        <div style={{ ...serif(84), marginTop: 60, ...lift(f, 14) }}>The work is still the easy part.</div>
        <div style={{ ...serif(84, MUTED, true), marginTop: 24, ...lift(f, 40) }}>Getting paid is the job after the job.</div>
      </div>
    </Page>
  );
};

const Question: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Page bg={PAPER}>
      <Masthead dark={false} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
        <div style={{ fontFamily: BRAND_FONT, fontSize: 200, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: INK, ...lift(f, 0, 24) }}>
          You have
          <br />
          clients?
        </div>
      </AbsoluteFill>
    </Page>
  );
};

const Answer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Page bg={LIME}>
      <Masthead dark={false} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
        <div style={{ fontFamily: BRAND_FONT, fontSize: 230, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: INK, ...lift(f, 0, 24) }}>
          Invoice
          <br />
          them.
        </div>
        <div style={{ height: 10, background: INK, marginTop: 50, width: `${interpolate(f, [12, 34], [0, 100], { ...CLAMP, easing: EASE_OUT })}%` }} />
      </AbsoluteFill>
    </Page>
  );
};

const STEPS = ['Create it.', 'Sign it.', 'Send it.', 'Get paid.'];

/** The app, one step per shot, on paper. */
const AppStep: React.FC<{ step: number }> = ({ step }) => {
  const f = useCurrentFrame();
  const screen = [
    <EditorLight key="c" f={f + 6} adds={[0, 8, 16]} />,
    <SignLight key="s" f={f} drawStart={0} drawEnd={24} doneAt={28} />,
    <ScanPay key="p" f={f + 10} detectAt={0} sheetAt={8} payAt={24} />,
    <DetailLight key="d" f={f} paidAt={4} />,
  ][step];
  return (
    <Page bg={PAPER}>
      <Masthead dark={false} />
      <div style={{ position: 'absolute', left: MARGIN, top: 250, display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <span style={meta('rgba(18,17,43,0.55)', 24)}>{String(step + 1).padStart(2, '0')} / 04</span>
        <span style={{ fontFamily: BRAND_FONT, fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', color: INK }}>{STEPS[step]}</span>
      </div>
      <Phone width={480} lightScreen shadow="0 50px 90px rgba(18,17,43,0.22)" style={{ left: 300, top: 420 + interpolate(f, [0, 10], [40, 0], { ...CLAMP, easing: EASE_OUT }) }}>
        {screen}
      </Phone>
    </Page>
  );
};

const EndCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [4, 20], [0, 100], { ...CLAMP, easing: EASE_OUT });
  return (
    <Page bg={INK}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <AppMark size={180} style={lift(f, 0)} />
        <div style={{ marginTop: 64, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 800, height: 800 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 60, textAlign: 'center', ...serif(68, PAPER, true), ...lift(f, 14) }}>
          You have clients? <span style={{ color: LIME }}>Invoice them.</span>
        </div>
        <div style={{ height: 2, width: 800, background: MUTED, opacity: 0.5, margin: '56px 0 44px', ...lift(f, DOC_PRICE_AT) }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, ...lift(f, DOC_PRICE_AT) }}>
          <span style={meta(MUTED, 28)}>First month</span>
          <span style={{ fontFamily: FONT, fontSize: 140, fontWeight: 800, letterSpacing: '-0.05em', color: LIME }}>$0.99</span>
        </div>
        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, ...lift(f, DOC_PRICE_AT + 10) }}>
          <div style={{ padding: '24px 52px', borderRadius: 999, background: PAPER, color: INK, fontFamily: FONT, fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED, 22)}>Then $9.99/month · Cancel anytime</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, textAlign: 'center', ...lift(f, 20) }}>
        <div style={meta(MUTED, 22)}>
          Powered by <span style={{ color: PAPER, fontWeight: 800 }}>NewMux</span>
        </div>
        <div style={{ ...meta('rgba(244,241,234,0.32)', 15), marginTop: 22, letterSpacing: '0.12em' }}>
          Archival film: Prelinger Archives (public domain) · Portrait: J. S. Duplessis, c. 1785
        </div>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [len - 12, len], [0, 1], CLAMP) }} />
    </Page>
  );
};

// ---------------------------------------------------------------------------------------------

const renderShot = (s: DocShot) => {
  switch (s.kind) {
    case 'quote':
      return <Quote len={s.len} />;
    case 'film':
      return <FilmShot shot={s} />;
    case 'now':
      return <Now />;
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
  <AbsoluteFill style={{ background: NIGHT }}>
    {DOC_SHOTS.map((s, i) => (
      <Sequence key={i} from={DOC_STARTS[i]} durationInFrames={s.len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${s.kind === 'film' ? ` ${s.clip}` : ''}`}>
        {renderShot(s)}
      </Sequence>
    ))}
    {music && <Audio src={staticFile('audio/music-doc.wav')} />}
  </AbsoluteFill>
);
