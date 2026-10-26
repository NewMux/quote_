import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_IN, EASE_OUT, SPRING } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, PdfV2, ScanPay, SignLight } from '../v2/screens';
import { CLIENTS, FPS, SHOTS, TITLES, WORDS, type Shot } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const { midnight: INK, lime: LIME, paper: PAPER, violet: VIOLET } = BRAND;
const MUTED_DARK = 'rgba(244,241,234,0.55)';
const MUTED_LIGHT = 'rgba(18,17,43,0.55)';
const PHONE_SHADOW = '0 60px 110px rgba(18,17,43,0.28), 0 14px 34px rgba(18,17,43,0.16)';

/** Small caps metadata, the reel's editorial voice. */
const meta = (color: string, size = 26): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color,
  fontVariantNumeric: 'tabular-nums',
});

const headline = (size: number, color: string, weight = 800): React.CSSProperties => ({
  fontFamily: BRAND_FONT,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: '-0.045em',
  lineHeight: 0.92,
  color,
  whiteSpace: 'nowrap',
});

/** Slam-in on the cut: settles from a slight overscale and blur in four frames. */
const slam = (f: number, from = 1.14): React.CSSProperties => {
  const p = interpolate(f, [0, 5], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return { scale: String(from + (1 - from) * p), filter: `blur(${(1 - p) * 14}px)` };
};

/** The magazine frame around every shot: masthead, shot counter, running timecode, tagline. */
const Chrome: React.FC<{ index: number; from: number; dark: boolean }> = ({ index, from, dark }) => {
  const frame = useCurrentFrame() + from;
  const c = dark ? MUTED_DARK : MUTED_LIGHT;
  const secs = Math.floor(frame / FPS);
  const tc = `00:${String(secs).padStart(2, '0')}:${String(frame % FPS).padStart(2, '0')}`;
  const row: React.CSSProperties = { position: 'absolute', left: 70, right: 70, display: 'flex', justifyContent: 'space-between' };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ ...row, top: 150 }}>
        <span style={meta(c)}>Invoice Them</span>
        <span style={meta(c)}>
          {String(index + 1).padStart(2, '0')} / {SHOTS.length}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 196, height: 2, background: c, opacity: 0.5 }} />
      <div style={{ ...row, top: 1600 }}>
        <span style={meta(c)}>{tc}</span>
        <span style={meta(c)}>Bill it · Send it · Get paid</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const WORD_STYLE = [
  { bg: INK, ink: PAPER, size: 500 },
  { bg: PAPER, ink: INK, size: 440 },
  { bg: LIME, ink: INK, size: 250 },
  { bg: INK, ink: LIME, size: 255 },
  { bg: LIME, ink: INK, size: 340 },
];

const Word: React.FC<{ i: number; len: number }> = ({ i, len }) => {
  const f = useCurrentFrame();
  const s = WORD_STYLE[i];
  const push = interpolate(f, [0, len], [1, 1.05]);
  const note = interpolate(f, [8, 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const rule = interpolate(f, [14, 26], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: s.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ scale: String(push), display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ ...headline(s.size, s.ink), ...slam(f) }}>{WORDS[i]}</div>
        {i === 2 && (
          // A dictionary entry under "clients?".
          <div style={{ marginTop: 60, opacity: note, translate: `0px ${(1 - note) * 20}px`, fontFamily: FONT, color: INK }}>
            <div style={{ fontSize: 44, fontWeight: 500 }}>
              <span style={{ fontWeight: 800 }}>cli·ents</span> <span style={{ fontStyle: 'italic', opacity: 0.6 }}>n. pl.</span>
            </div>
            <div style={{ fontSize: 44, fontWeight: 500, marginTop: 10 }}>People who owe you money.</div>
          </div>
        )}
        {i === 4 && (
          <div style={{ marginTop: 40, width: '100%' }}>
            <div style={{ height: 14, background: INK, width: `${rule * 100}%` }} />
            <div style={{ ...meta(INK, 30), marginTop: 30, opacity: note }}>All of them. Today.</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** A client file card. Four looks alternate so every half-beat cut reads. */
const CARD_LOOKS = [
  { bg: PAPER, ink: INK, muted: MUTED_LIGHT, tag: INK, tagInk: PAPER },
  { bg: INK, ink: PAPER, muted: MUTED_DARK, tag: LIME, tagInk: INK },
  { bg: PAPER, ink: INK, muted: MUTED_LIGHT, tag: VIOLET, tagInk: PAPER },
  { bg: VIOLET, ink: PAPER, muted: 'rgba(244,241,234,0.7)', tag: PAPER, tagInk: VIOLET },
];

const ClientCard: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const c = CLIENTS[i];
  const look = CARD_LOOKS[i % CARD_LOOKS.length];
  const rise = interpolate(f, [0, 5], [40, 0], { ...CLAMP, easing: EASE_OUT });
  const nameSize = Math.min(150, 940 / (c.name.length * 0.52));
  return (
    <AbsoluteFill style={{ background: look.bg }}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: i % 2 ? 470 : 360, translate: `0px ${rise}px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={meta(look.muted, 30)}>Client</span>
          <span style={meta(look.muted, 30)}>No. {String(i + 1).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 3, background: look.ink, margin: '24px 0 50px' }} />
        <div style={{ ...headline(nameSize, look.ink, 700), whiteSpace: 'normal' }}>{c.name}</div>
        <div style={{ fontFamily: FONT, fontSize: 50, fontWeight: 500, color: look.muted, marginTop: 34 }}>{c.job}</div>
        <div style={{ height: 2, background: look.muted, margin: '70px 0 34px', opacity: 0.6 }} />
        <div style={meta(look.muted, 28)}>Amount due</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontFamily: FONT, fontSize: 116, fontWeight: 800, letterSpacing: '-0.04em', color: look.ink, fontVariantNumeric: 'tabular-nums' }}>
            {c.amount}
          </span>
        </div>
        <div style={{ marginTop: 34, display: 'inline-block', padding: '14px 26px', borderRadius: 999, background: look.tag, ...meta(look.tagInk, 26) }}>
          Not invoiced
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TOTAL_OWED = '$34,385';

/** The music drops out: the roll's total, on black. */
const Drop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#08081A', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...headline(230, LIME, 800), ...slam(f, 0.9) }}>{TOTAL_OWED}</div>
      <div style={{ ...meta(PAPER, 34), marginTop: 50 }}>Still not invoiced</div>
    </AbsoluteFill>
  );
};

const TITLE_LOOKS = [
  { bg: PAPER, ink: INK, accent: VIOLET },
  { bg: LIME, ink: INK, accent: INK },
  { bg: VIOLET, ink: PAPER, accent: LIME },
  { bg: INK, ink: LIME, accent: LIME },
];

/** One of the four steps, numbered, with a progress rule. */
const Title: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const look = TITLE_LOOKS[i];
  const muted = look.bg === INK || look.bg === VIOLET ? MUTED_DARK : MUTED_LIGHT;
  return (
    <AbsoluteFill style={{ background: look.bg }}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 640 }}>
        <div style={meta(muted, 34)}>Step {String(i + 1).padStart(2, '0')} / 04</div>
        <div style={{ ...headline(i === 3 ? 230 : 290, look.ink), marginTop: 30, transformOrigin: '0% 50%', ...slam(f, 1.2) }}>{TITLES[i]}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 70 }}>
          {TITLES.map((_, k) => (
            <div key={k} style={{ flex: 1, height: 10, background: k <= i ? look.accent : muted, opacity: k <= i ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A product shot: the phone on paper, with a hard punch-in partway through (a second angle). */
const ProductStage: React.FC<{
  caption: string;
  punchAt: number;
  punch: { scale: number; x: number; y: number };
  children: React.ReactNode;
  bg?: string;
}> = ({ caption, punchAt, punch, children, bg = PAPER }) => {
  const f = useCurrentFrame();
  const punched = f >= punchAt;
  const drift = interpolate(f, [0, 120], [0, -40]);
  const enter = interpolate(f, [0, 10], [260, 0], { ...CLAMP, easing: SPRING });
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      {/* The second angle sits in a window between the masthead and the footer. */}
      <AbsoluteFill style={{ clipPath: punched ? 'inset(290px 0 350px 0)' : undefined }}>
        <AbsoluteFill
          style={{
            transformOrigin: `${punch.x}px ${punch.y}px`,
            scale: String(punched ? punch.scale + (f - punchAt) * 0.004 : 1),
            translate: `0px ${punched ? 0 : enter + drift}px`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 230, display: 'flex', gap: 24, alignItems: 'baseline' }}>
        <span style={{ ...meta(INK, 26), padding: '8px 16px', background: LIME }}>Fig.</span>
        <span style={{ fontFamily: FONT, fontSize: 40, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>{caption}</span>
      </div>
    </AbsoluteFill>
  );
};

const PHONE = { width: 700, left: 190, top: 330 };

const CreateShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Line items in seconds." punchAt={32} punch={{ scale: 1.9, x: 540, y: 1150 }}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <EditorLight f={f} adds={[4, 14, 24]} />
      </Phone>
    </ProductStage>
  );
};

const SignShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Signed on the spot." punchAt={24} punch={{ scale: 1.7, x: 540, y: 1000 }} bg={LIME}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <SignLight f={f} drawStart={2} drawEnd={26} doneAt={30} />
      </Phone>
    </ProductStage>
  );
};

const SendShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="A PDF with a pay link." punchAt={22} punch={{ scale: 1.55, x: 780, y: 1300 }}>
      <div style={{ position: 'absolute', left: 50, top: 340, scale: '0.95', transformOrigin: '0% 0%', rotate: '-3deg' }}>
        <PdfV2 payReveal={1} />
      </div>
      <Phone width={500} lightScreen shadow={PHONE_SHADOW} style={{ left: 540, top: 900, rotate: '4deg' }}>
        <ScanPay f={f} detectAt={6} sheetAt={16} payAt={28} />
      </Phone>
    </ProductStage>
  );
};

const PaidShot: React.FC = () => {
  const f = useCurrentFrame();
  const stamp = interpolate(f, [36, 42], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <ProductStage caption="Paid. Tracked. Done." punchAt={34} punch={{ scale: 1.6, x: 540, y: 760 }} bg={PAPER}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <DetailLight f={f} paidAt={10} />
      </Phone>
      <div
        style={{
          position: 'absolute',
          left: 600,
          top: 560,
          padding: '10px 34px',
          border: `10px solid ${INK}`,
          background: LIME,
          ...headline(110, INK, 800),
          rotate: '-9deg',
          scale: String(1.6 - stamp * 0.6),
          opacity: stamp,
        }}
      >
        PAID
      </div>
    </ProductStage>
  );
};

/** The payoff: the balance arrives. */
const TotalShot: React.FC = () => {
  const f = useCurrentFrame();
  const amount = interpolate(f, [0, 14], [0, 4290], { ...CLAMP, easing: EASE_OUT });
  const label = interpolate(f, [10, 16], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: LIME, justifyContent: 'center', padding: '0 70px' }}>
      <div style={meta(INK, 34)}>Received · Northwind Studio</div>
      <div style={{ ...headline(180, INK), marginTop: 30, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, letterSpacing: '-0.06em' }}>
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style={{ height: 6, background: INK, marginTop: 40, width: `${label * 100}%` }} />
      <div style={{ ...meta(INK, 34), marginTop: 30, opacity: label }}>Paid in full · 2 days early</div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const mark = interpolate(f, [0, 12], [0, 1], { ...CLAMP, easing: SPRING });
  const wipe = interpolate(f, [6, 22], [0, 100], { ...CLAMP, easing: EASE_OUT });
  const line = (at: number) => ({
    opacity: interpolate(f, [at, at + 6], [0, 1], CLAMP),
    translate: `0px ${interpolate(f, [at, at + 12], [30, 0], { ...CLAMP, easing: EASE_OUT })}px`,
  });
  const fadeOut = interpolate(f, [len - 8, len], [0, 1], { ...CLAMP, easing: EASE_IN });
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 430, scale: String(interpolate(f, [0, len], [1, 1.03])) }}>
        <AppMark size={220} style={{ scale: String(0.6 + 0.4 * mark), opacity: Math.min(1, mark * 2) }} />
        <div style={{ marginTop: 90, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 860, height: 860 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 110, textAlign: 'center', ...line(22) }}>
          <div style={{ fontFamily: BRAND_FONT, fontSize: 76, fontWeight: 600, color: PAPER, letterSpacing: '-0.03em' }}>You have clients?</div>
          <div style={{ fontFamily: BRAND_FONT, fontSize: 76, fontWeight: 800, color: LIME, letterSpacing: '-0.03em' }}>Invoice them.</div>
        </div>
        <div style={{ marginTop: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, ...line(34) }}>
          <div style={{ padding: '26px 56px', borderRadius: 999, background: PAPER, color: INK, fontFamily: FONT, fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED_DARK, 28)}>Free for a week</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

const DARK_SHOTS = new Set(['drop', 'end']);
const DARK_BGS: string[] = [INK, VIOLET];
const isDark = (s: Shot) =>
  DARK_SHOTS.has(s.kind) ||
  (s.kind === 'word' && WORD_STYLE[s.i!].bg === INK) ||
  (s.kind === 'client' && DARK_BGS.includes(CARD_LOOKS[s.i! % CARD_LOOKS.length].bg)) ||
  (s.kind === 'title' && DARK_BGS.includes(TITLE_LOOKS[s.i!].bg));

const renderShot = (s: Shot) => {
  switch (s.kind) {
    case 'word':
      return <Word i={s.i!} len={s.len} />;
    case 'client':
      return <ClientCard i={s.i!} />;
    case 'drop':
      return <Drop />;
    case 'title':
      return <Title i={s.i!} />;
    case 'create':
      return <CreateShot />;
    case 'sign':
      return <SignShot />;
    case 'send':
      return <SendShot />;
    case 'paid':
      return <PaidShot />;
    case 'total':
      return <TotalShot />;
    case 'end':
      return <EndCard len={s.len} />;
  }
};

/** A one-frame white flash on the big hits. */
const FLASHES = SHOTS.filter((s) => (s.kind === 'word' && (s.i === 2 || s.i === 3)) || s.kind === 'total' || s.kind === 'end').map((s) => s.from);

export const ReelVideo: React.FC<{ music?: boolean }> = ({ music = true }) => (
  <AbsoluteFill style={{ background: INK }}>
    {SHOTS.map((s, i) => (
      <Sequence key={i} from={s.from} durationInFrames={s.len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${s.i ?? ''}`}>
        {renderShot(s)}
        {s.kind !== 'end' && <Chrome index={i} from={s.from} dark={isDark(s)} />}
      </Sequence>
    ))}
    {FLASHES.map((at) => (
      <Sequence key={at} from={at} durationInFrames={1} layout="none">
        <AbsoluteFill style={{ background: '#FFFFFF', opacity: 0.85 }} />
      </Sequence>
    ))}
    {music && <Audio src={staticFile('audio/music-reel.wav')} />}
  </AbsoluteFill>
);


