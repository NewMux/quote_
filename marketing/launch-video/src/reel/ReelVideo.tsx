import React, { createContext, useContext } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_IN, EASE_OUT, SPRING } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, PdfV2, ScanPay, SignLight } from '../v2/screens';
import { BEAT, CLIENTS, FPS, GAP, HITS, SHOTS, STROBES, TAGS, TITLES, TOTAL_OWED, WORDS, type Shot } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const { midnight: INK, lime: LIME, paper: PAPER, violet: VIOLET } = BRAND;
const BLACK = '#07071A';
const MUTED_DARK = 'rgba(244,241,234,0.55)';
const MUTED_LIGHT = 'rgba(18,17,43,0.55)';
const PHONE_SHADOW = '0 60px 110px rgba(18,17,43,0.28), 0 14px 34px rgba(18,17,43,0.16)';

// ---------------------------------------------------------------------------------------------
// Energy: every hit in HITS kicks the camera (shake, zoom punch) and splits the type's color,
// decaying over a few frames.

/** 0 (calm) and up, at an absolute frame. */
const energyAt = (frame: number) =>
  HITS.reduce((e, h) => (frame >= h.at && frame - h.at < 12 ? e + h.power * Math.exp(-(frame - h.at) / 3.2) : e), 0);

const Energy = createContext(0);
const useEnergy = () => useContext(Energy);

/** Red / cyan split on headline type, scaled by the current energy. */
const split = (e: number): React.CSSProperties =>
  e < 0.04 ? {} : { textShadow: `${e * 14}px 0 rgba(255,40,90,0.75), ${-e * 14}px 0 rgba(0,210,255,0.75)` };

// ---------------------------------------------------------------------------------------------

const meta = (color: string, size = 26): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color,
  fontVariantNumeric: 'tabular-nums',
});

const headline = (size: number, color: string, weight = 800): React.CSSProperties => ({
  fontFamily: BRAND_FONT,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: '-0.04em',
  lineHeight: 0.9,
  color,
  whiteSpace: 'nowrap',
});

/** Font size that sets `text` across `width` px in Bricolage ExtraBold caps. */
const fit = (text: string, width = 960, max = 520) => Math.min(max, width / (text.length * 0.66));

/** Settles from overscale and blur in a few frames. */
const slam = (f: number, from = 1.25, len = 4): React.CSSProperties => {
  const p = interpolate(f, [0, len], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return { scale: String(from + (1 - from) * p), filter: `blur(${(1 - p) * 18}px)` };
};

/** The magazine frame: masthead, shot counter, timecode, tagline. Sits outside the shake. */
const Chrome: React.FC<{ index: number; from: number; dark: boolean }> = ({ index, from, dark }) => {
  const frame = useCurrentFrame() + from;
  const c = dark ? MUTED_DARK : MUTED_LIGHT;
  const tc = `00:${String(Math.floor(frame / FPS)).padStart(2, '0')}:${String(frame % FPS).padStart(2, '0')}`;
  const row: React.CSSProperties = { position: 'absolute', left: 70, right: 70, display: 'flex', justifyContent: 'space-between' };
  return (
    <AbsoluteFill>
      <div style={{ ...row, top: 150 }}>
        <span style={meta(c)}>Invoice Them</span>
        <span style={meta(c)}>
          {String(index + 1).padStart(2, '0')} / {SHOTS.length}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 196, height: 2, background: c, opacity: 0.5 }} />
      <div style={{ ...row, top: 1600 }}>
        <span style={meta(c)}>● REC {tc}</span>
        <span style={meta(c)}>Bill it · Send it · Get paid</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

/** A word set full-width, with outlined echoes stacked above and below that fly outward. */
const EchoWord: React.FC<{ text: string; bg: string; ink: string; echo?: string; len: number }> = ({ text, bg, ink, echo = ink, len }) => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const size = fit(text);
  const spread = interpolate(f, [0, 6, len], [0.4, 1, 1.12], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {[-4, -3, -2, -1, 1, 2, 3, 4].map((k) => (
        <div
          key={k}
          style={{
            ...headline(size, 'transparent'),
            position: 'absolute',
            WebkitTextStroke: `3px ${echo}`,
            opacity: 0.55 - Math.abs(k) * 0.1,
            translate: `0px ${k * size * 0.95 * spread}px`,
          }}
        >
          {text}
        </div>
      ))}
      <div style={{ ...headline(size, ink), ...slam(f), ...split(e) }}>{text}</div>
    </AbsoluteFill>
  );
};

const WORD_LOOKS = [
  { bg: BLACK, ink: PAPER, echo: LIME },
  { bg: PAPER, ink: INK, echo: VIOLET },
  { bg: LIME, ink: INK, echo: INK },
  { bg: BLACK, ink: LIME, echo: LIME },
  { bg: LIME, ink: INK, echo: INK },
];

const CARD_LOOKS = [
  { bg: PAPER, ink: INK, muted: MUTED_LIGHT, tag: INK, tagInk: LIME },
  { bg: BLACK, ink: PAPER, muted: MUTED_DARK, tag: LIME, tagInk: INK },
  { bg: VIOLET, ink: PAPER, muted: 'rgba(244,241,234,0.7)', tag: PAPER, tagInk: VIOLET },
  { bg: LIME, ink: INK, muted: MUTED_LIGHT, tag: INK, tagInk: LIME },
];

/** A client file card from the roll: who, for what, how much, not invoiced. */
const ClientCard: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const c = CLIENTS[i % CLIENTS.length];
  const look = CARD_LOOKS[i % CARD_LOOKS.length];
  const nameSize = Math.min(150, 880 / (c.name.length * 0.56));
  return (
    <AbsoluteFill style={{ background: look.bg }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: [380, 520, 440, 600][i % 4], translate: `${interpolate(f, [0, 3], [i % 2 ? 40 : -40, 0], CLAMP)}px 0px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={meta(look.muted, 30)}>Client</span>
          <span style={meta(look.muted, 30)}>No. {String(i + 1).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 3, background: look.ink, margin: '24px 0 44px' }} />
        <div style={headline(nameSize, look.ink, 700)}>{c.name}</div>
        <div style={{ fontFamily: FONT, fontSize: 48, fontWeight: 500, color: look.muted, marginTop: 30 }}>{c.job}</div>
        <div style={{ fontFamily: FONT, fontSize: fit(c.amount, 880, 140) * 1.05, fontWeight: 900, letterSpacing: '-0.05em', color: look.ink, marginTop: 50, fontVariantNumeric: 'tabular-nums', ...split(e) }}>
          {c.amount}
        </div>
        <div style={{ marginTop: 30, display: 'inline-block', padding: '16px 30px', background: look.tag, rotate: '-3deg', ...meta(look.tagInk, 34) }}>
          Not invoiced
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The build: what they owe you climbs, the frame strobes, then silence. */
const Build: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const q = Math.floor(f / (BEAT / 4));
  const owed = interpolate(f, [0, len - 6], [0, TOTAL_OWED], { ...CLAMP, easing: EASE_IN });
  const flip = f >= BEAT && q % 2 === 1;
  const ink = flip ? INK : LIME;
  const bar = interpolate(f, [0, len - 4], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: flip ? LIME : BLACK, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...meta(flip ? INK : PAPER, 36), marginBottom: 40 }}>Owed to you</div>
      <div style={{ ...headline(210, ink), fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.06em', scale: String(0.75 + q * 0.045), fontVariantNumeric: 'tabular-nums', ...split(e) }}>
        ${Math.round(owed).toLocaleString('en-US')}
      </div>
      <div style={{ width: 860, height: 14, background: flip ? 'rgba(18,17,43,0.2)' : 'rgba(244,241,234,0.15)', marginTop: 70 }}>
        <div style={{ width: `${bar * 100}%`, height: '100%', background: ink }} />
      </div>
      <div style={{ ...meta(flip ? INK : PAPER, 40), marginTop: 50 }}>Still not invoiced</div>
    </AbsoluteFill>
  );
};

/** "INVOICE THEM" rows racing across the frame in opposite directions. */
const KineticRows: React.FC<{ bg?: string; opacity?: number; speed?: number }> = ({ bg = BLACK, opacity = 1, speed = 38 }) => {
  const f = useCurrentFrame();
  const row = 'INVOICE THEM — INVOICE THEM — INVOICE THEM — ';
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden', opacity }}>
      <div style={{ position: 'absolute', left: -600, top: -250, rotate: '-9deg' }}>
        {Array.from({ length: 13 }, (_, k) => (
          <div
            key={k}
            style={{
              ...headline(200, k % 2 ? 'transparent' : LIME),
              WebkitTextStroke: k % 2 ? `3px ${LIME}` : undefined,
              translate: `${(k % 2 ? -1 : 1) * f * speed - (k % 2 ? 0 : 1800)}px 0px`,
              lineHeight: 1.05,
            }}
          >
            {row}
            {row}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Kinetic: React.FC = () => {
  const f = useCurrentFrame();
  const e = useEnergy();
  return (
    <AbsoluteFill>
      <KineticRows />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: LIME, padding: '40px 56px', rotate: '-9deg', ...slam(f, 1.6, 5) }}>
          <div style={{ ...headline(150, INK), ...split(e) }}>INVOICE THEM.</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TITLE_LOOKS = [
  { bg: PAPER, ink: INK, echo: VIOLET },
  { bg: LIME, ink: INK, echo: INK },
  { bg: VIOLET, ink: PAPER, echo: LIME },
  { bg: BLACK, ink: LIME, echo: LIME },
];

/** A product shot: three angles, one per beat. Angle 0 is wide; angles 1 and 2 punch in, inside a
 * window between the masthead and the footer. Each angle whips in. */
const ProductStage: React.FC<{
  caption: string;
  angles: { scale: number; x: number; y: number }[];
  children: React.ReactNode;
  bg?: string;
}> = ({ caption, angles, children, bg = PAPER }) => {
  const f = useCurrentFrame();
  const angle = Math.min(2, Math.floor(f / BEAT));
  const local = f - angle * BEAT;
  const whip = interpolate(local, [0, 4], [1, 0], { ...CLAMP, easing: EASE_OUT });
  const a = angle === 0 ? { scale: 1, x: 540, y: 960 } : angles[angle - 1];
  const dir = angle % 2 ? -1 : 1;
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ clipPath: angle ? 'inset(290px 0 350px 0)' : undefined }}>
        <AbsoluteFill
          style={{
            transformOrigin: `${a.x}px ${a.y}px`,
            scale: String(a.scale + local * 0.006),
            translate: `${whip * 420 * dir}px ${angle === 0 ? interpolate(f, [0, BEAT], [60, 0], { ...CLAMP, easing: SPRING }) : 0}px`,
            filter: whip > 0.02 ? `blur(${whip * 26}px)` : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 230, display: 'flex', gap: 24, alignItems: 'baseline' }}>
        <span style={{ ...meta(INK, 26), padding: '8px 16px', background: LIME }}>Fig.</span>
        <span style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>{caption}</span>
      </div>
    </AbsoluteFill>
  );
};

const PHONE = { width: 700, left: 190, top: 330 };

const CreateShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Line items in seconds." angles={[{ scale: 1.45, x: 540, y: 780 }, { scale: 1.45, x: 540, y: 1260 }]}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <EditorLight f={f} adds={[0, 7, 14]} />
      </Phone>
    </ProductStage>
  );
};

const SignShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Signed on the spot." angles={[{ scale: 1.45, x: 540, y: 860 }, { scale: 1.45, x: 540, y: 1180 }]} bg={LIME}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <SignLight f={f} drawStart={0} drawEnd={22} doneAt={26} />
      </Phone>
    </ProductStage>
  );
};

const SendShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="A PDF with a pay link." angles={[{ scale: 1.3, x: 380, y: 820 }, { scale: 1.4, x: 790, y: 1300 }]}>
      <div style={{ position: 'absolute', left: 50, top: 340, scale: '0.95', transformOrigin: '0% 0%', rotate: '-3deg' }}>
        <PdfV2 payReveal={1} />
      </div>
      <Phone width={500} lightScreen shadow={PHONE_SHADOW} style={{ left: 540, top: 900, rotate: '4deg' }}>
        <ScanPay f={f} detectAt={4} sheetAt={14} payAt={26} />
      </Phone>
    </ProductStage>
  );
};

const PaidShot: React.FC = () => {
  const f = useCurrentFrame();
  const stamp = interpolate(f, [BEAT * 2, BEAT * 2 + 4], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <ProductStage caption="Paid. Tracked. Done." angles={[{ scale: 1.45, x: 540, y: 820 }, { scale: 1.45, x: 540, y: 1000 }]}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <DetailLight f={f} paidAt={4} />
      </Phone>
      <div
        style={{
          position: 'absolute',
          left: 600,
          top: 1010,
          padding: '8px 30px',
          border: `10px solid ${INK}`,
          background: LIME,
          ...headline(96, INK),
          rotate: '-9deg',
          scale: String(2 - stamp),
          opacity: stamp,
        }}
      >
        PAID
      </div>
    </ProductStage>
  );
};

const FLIP_LOOKS = [
  { bg: LIME, ink: INK },
  { bg: BLACK, ink: PAPER },
  { bg: PAPER, ink: INK },
  { bg: VIOLET, ink: PAPER },
];

/** The payoff roll: the same clients, now PAID. */
const Flip: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const c = CLIENTS[i % CLIENTS.length];
  const look = FLIP_LOOKS[i % FLIP_LOOKS.length];
  const stampBg = look.bg === LIME ? INK : LIME;
  return (
    <AbsoluteFill style={{ background: look.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...meta(look.ink, 36), opacity: 0.7 }}>{c.name}</div>
      <div style={{ fontFamily: FONT, fontSize: fit(c.amount, 940, 200) * 1.1, fontWeight: 900, letterSpacing: '-0.05em', color: look.ink, marginTop: 30, fontVariantNumeric: 'tabular-nums', ...split(e) }}>
        {c.amount}
      </div>
      <div style={{ marginTop: 40, padding: '14px 44px', background: stampBg, ...headline(150, look.bg === LIME ? LIME : INK), rotate: `${i % 2 ? 7 : -7}deg`, ...slam(f, 1.8, 3) }}>
        PAID
      </div>
    </AbsoluteFill>
  );
};

const Total: React.FC = () => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const amount = interpolate(f, [0, 16], [0, TOTAL_OWED], { ...CLAMP, easing: EASE_OUT });
  const done = interpolate(f, [16, 20], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: LIME, justifyContent: 'center', padding: '0 70px' }}>
      <div style={meta(INK, 36)}>Collected · 10 clients</div>
      <div style={{ ...headline(250, INK), fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.06em', marginTop: 30, fontVariantNumeric: 'tabular-nums', ...split(e) }}>
        ${Math.round(amount).toLocaleString('en-US')}
      </div>
      <div style={{ height: 16, background: INK, marginTop: 40, width: `${interpolate(f, [0, 16], [0, 100], CLAMP)}%` }} />
      <div style={{ ...headline(150, INK), marginTop: 40, opacity: done, ...slam(f - 16, 1.4) }}>PAID.</div>
    </AbsoluteFill>
  );
};

const TAG_LOOKS = [
  { bg: BLACK, ink: PAPER, echo: LIME },
  { bg: PAPER, ink: INK, echo: VIOLET },
  { bg: LIME, ink: INK, echo: INK },
  { bg: VIOLET, ink: PAPER, echo: LIME },
];

/** Frames into the end card where the price slams in (beat 36, on a hit). */
const PRICE_AT = BEAT * 2;

const EndCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const e = useEnergy();
  const mark = interpolate(f, [0, 8], [0, 1], { ...CLAMP, easing: SPRING });
  const wipe = interpolate(f, [4, 14], [0, 100], { ...CLAMP, easing: EASE_OUT });
  const line = (at: number) => ({
    opacity: interpolate(f, [at, at + 4], [0, 1], CLAMP),
    translate: `0px ${interpolate(f, [at, at + 8], [40, 0], { ...CLAMP, easing: EASE_OUT })}px`,
  });
  const fadeOut = interpolate(f, [len - 8, len], [0, 1], { ...CLAMP, easing: EASE_IN });
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <KineticRows bg={BLACK} opacity={0.12} speed={10} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300, scale: String(interpolate(f, [0, len], [1, 1.05])) }}>
        <AppMark size={200} style={{ scale: String(1.8 - 0.8 * mark), opacity: Math.min(1, mark * 2) }} />
        <div style={{ marginTop: 70, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 880, height: 880 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 70, textAlign: 'center', ...line(BEAT) }}>
          <div style={{ ...headline(84, PAPER, 700), letterSpacing: '-0.03em' }}>YOU HAVE CLIENTS?</div>
          <div style={{ ...headline(110, LIME), marginTop: 14, ...split(e) }}>INVOICE THEM.</div>
        </div>
        <div style={{ marginTop: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: f >= PRICE_AT ? 1 : 0 }}>
          <div style={meta(PAPER, 34)}>First month</div>
          <div style={{ ...headline(230, LIME, 900), fontFamily: FONT, letterSpacing: '-0.06em', marginTop: 14, ...slam(f - PRICE_AT, 1.6, 4), ...split(e) }}>$0.99</div>
        </div>
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, ...line(PRICE_AT + BEAT) }}>
          <div style={{ padding: '26px 56px', borderRadius: 999, background: LIME, color: INK, fontFamily: FONT, fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED_DARK, 26)}>Then $9.99/month · Cancel anytime</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const bgOf = (s: Shot): string => {
  switch (s.kind) {
    case 'word':
      return WORD_LOOKS[s.i!].bg;
    case 'client':
      return CARD_LOOKS[s.i! % CARD_LOOKS.length].bg;
    case 'title':
      return TITLE_LOOKS[s.i!].bg;
    case 'flip':
      return FLIP_LOOKS[s.i! % FLIP_LOOKS.length].bg;
    case 'tag':
      return TAG_LOOKS[s.i!].bg;
    case 'sign':
    case 'total':
      return LIME;
    case 'create':
    case 'send':
    case 'paid':
      return PAPER;
    default:
      return BLACK;
  }
};
const DARK_BGS: string[] = [BLACK, VIOLET];
const isDark = (s: Shot) => DARK_BGS.includes(bgOf(s));

const renderShot = (s: Shot) => {
  switch (s.kind) {
    case 'word':
      return <EchoWord text={WORDS[s.i!]} len={s.len} {...WORD_LOOKS[s.i!]} />;
    case 'client':
      return <ClientCard i={s.i!} />;
    case 'build':
      return <Build len={s.len} />;
    case 'kinetic':
      return <Kinetic />;
    case 'title':
      return <EchoWord text={TITLES[s.i!]} len={s.len} {...TITLE_LOOKS[s.i!]} />;
    case 'create':
      return <CreateShot />;
    case 'sign':
      return <SignShot />;
    case 'send':
      return <SendShot />;
    case 'paid':
      return <PaidShot />;
    case 'flip':
      return <Flip i={s.i!} />;
    case 'total':
      return <Total />;
    case 'tag':
      return <EchoWord text={TAGS[s.i!]} len={s.len} {...TAG_LOOKS[s.i!]} />;
    case 'end':
      return <EndCard len={s.len} />;
  }
};

export const ReelVideo: React.FC<{ music?: boolean }> = ({ music = true }) => {
  const frame = useCurrentFrame();
  const e = energyAt(frame);
  const shake = Math.min(e, 1.6);
  const gap = frame >= GAP.from && frame < GAP.to;
  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <Energy.Provider value={e}>
        <AbsoluteFill
          style={{
            translate: `${(random(`x${frame}`) - 0.5) * 50 * shake}px ${(random(`y${frame}`) - 0.5) * 50 * shake}px`,
            rotate: `${(random(`r${frame}`) - 0.5) * 2.4 * shake}deg`,
            scale: String(1.03 + 0.05 * Math.min(e, 1.2)),
            filter: STROBES.includes(frame) ? 'invert(1)' : undefined,
          }}
        >
          {SHOTS.map((s, i) => (
            <Sequence key={i} from={s.from} durationInFrames={s.len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${s.i ?? ''}`}>
              {renderShot(s)}
            </Sequence>
          ))}
        </AbsoluteFill>
        {SHOTS.map((s, i) =>
          s.kind === 'end' ? null : (
            <Sequence key={`c${i}`} from={s.from} durationInFrames={s.len} layout="none">
              <Chrome index={i} from={s.from} dark={isDark(s)} />
            </Sequence>
          )
        )}
        {gap && <AbsoluteFill style={{ background: '#000' }} />}
      </Energy.Provider>
      {music && <Audio src={staticFile('audio/music-reel.wav')} />}
    </AbsoluteFill>
  );
};
