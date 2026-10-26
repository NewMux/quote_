import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT } from '../anim';
import { BRAND, BRAND_FONT } from '../brand';
import { AppMark } from '../components/Bits';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { DetailLight, EditorLight, PdfV2, ScanPay, SignLight } from '../v2/screens';
import { BEAT, CLIENTS, FPS, PRICE_AT, SHOTS, TITLES, TOTAL_OWED, WORDS, type Shot } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const { midnight: INK, lime: LIME, paper: PAPER, violet: VIOLET } = BRAND;
const MUTED_DARK = 'rgba(244,241,234,0.55)';
const MUTED_LIGHT = 'rgba(18,17,43,0.55)';
const PHONE_SHADOW = '0 60px 110px rgba(18,17,43,0.22), 0 14px 34px rgba(18,17,43,0.12)';
const MARGIN = 80;

/** Small caps metadata, the reel's editorial voice. */
const meta = (color: string, size = 26): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color,
  fontVariantNumeric: 'tabular-nums',
});

const headline = (size: number, color: string, weight = 800): React.CSSProperties => ({
  fontFamily: BRAND_FONT,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: '-0.045em',
  lineHeight: 0.95,
  color,
  whiteSpace: 'nowrap',
});

const figures = (size: number, color: string): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: 800,
  letterSpacing: '-0.05em',
  lineHeight: 1,
  color,
  fontVariantNumeric: 'tabular-nums',
});

/** A line of type that settles into place on the cut. It is whole from the first frame — no mask,
 * so nothing ever reads as cut off. */
const Reveal: React.FC<{ at?: number; len?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at = 0, len = 7, children, style }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + len], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return <div style={{ translate: `0px ${(1 - p) * 30}px`, opacity: f < at ? 0 : 1, ...style }}>{children}</div>;
};

/** Fades and lifts in, for secondary lines. */
const lift = (f: number, at: number): React.CSSProperties => ({
  opacity: interpolate(f, [at, at + 6], [0, 1], CLAMP),
  translate: `0px ${interpolate(f, [at, at + 10], [24, 0], { ...CLAMP, easing: EASE_OUT })}px`,
});

/** The magazine frame around every shot: masthead, shot counter, timecode, tagline. */
const Chrome: React.FC<{ index: number; from: number; dark: boolean }> = ({ index, from, dark }) => {
  const frame = useCurrentFrame() + from;
  const c = dark ? MUTED_DARK : MUTED_LIGHT;
  const tc = `00:${String(Math.floor(frame / FPS)).padStart(2, '0')}:${String(frame % FPS).padStart(2, '0')}`;
  const row: React.CSSProperties = { position: 'absolute', left: MARGIN, right: MARGIN, display: 'flex', justifyContent: 'space-between' };
  return (
    <AbsoluteFill>
      <div style={{ ...row, top: 150 }}>
        <span style={meta(c)}>Invoice Them</span>
        <span style={meta(c)}>
          {String(index + 1).padStart(2, '0')} / {SHOTS.length}
        </span>
      </div>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 196, height: 2, background: c, opacity: 0.5 }} />
      <div style={{ ...row, top: 1600 }}>
        <span style={meta(c)}>{tc}</span>
        <span style={meta(c)}>Bill it · Send it · Get paid</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const WORD_LOOKS = [
  { bg: INK, ink: PAPER, size: 420 },
  { bg: PAPER, ink: INK, size: 400 },
  { bg: LIME, ink: INK, size: 250 },
  { bg: INK, ink: LIME, size: 250 },
  { bg: LIME, ink: INK, size: 330 },
];

const Word: React.FC<{ i: number; len: number }> = ({ i, len }) => {
  const f = useCurrentFrame();
  const look = WORD_LOOKS[i];
  const rule = interpolate(f, [8, 22], [0, 1], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: look.bg, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={{ scale: String(interpolate(f, [0, len], [1, 1.03])), transformOrigin: '0% 50%' }}>
        <Reveal>
          <div style={headline(look.size, look.ink)}>{WORDS[i]}</div>
        </Reveal>
        {i === 2 && (
          // A dictionary entry under "clients?".
          <div style={{ marginTop: 50, fontFamily: FONT, color: INK, ...lift(f, 8) }}>
            <div style={{ fontSize: 46, fontWeight: 500 }}>
              <span style={{ fontWeight: 800 }}>cli·ents</span> <span style={{ fontStyle: 'italic', opacity: 0.6 }}>n. pl.</span>
            </div>
            <div style={{ fontSize: 46, fontWeight: 500, marginTop: 8 }}>People who owe you money.</div>
          </div>
        )}
        {i === 4 && (
          <div style={{ marginTop: 50 }}>
            <div style={{ height: 12, background: INK, width: `${rule * 100}%` }} />
            <div style={{ ...meta(INK, 32), marginTop: 30, ...lift(f, 12) }}>Every one of them.</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const CARD_LOOKS = [
  { bg: PAPER, ink: INK, muted: MUTED_LIGHT, tag: INK, tagInk: PAPER },
  { bg: INK, ink: PAPER, muted: MUTED_DARK, tag: LIME, tagInk: INK },
  { bg: PAPER, ink: INK, muted: MUTED_LIGHT, tag: VIOLET, tagInk: PAPER },
  { bg: VIOLET, ink: PAPER, muted: 'rgba(244,241,234,0.7)', tag: PAPER, tagInk: VIOLET },
  { bg: INK, ink: PAPER, muted: MUTED_DARK, tag: LIME, tagInk: INK },
];

/** A client file card: who, for what, how much — not invoiced. */
const ClientCard: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const c = CLIENTS[i];
  const look = CARD_LOOKS[i];
  return (
    <AbsoluteFill style={{ background: look.bg }}>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 470 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={meta(look.muted, 30)}>Client</span>
          <span style={meta(look.muted, 30)}>No. {String(i + 1).padStart(2, '0')}</span>
        </div>
        <div style={{ height: 3, background: look.ink, margin: '24px 0 46px' }} />
        <Reveal len={5}>
          <div style={headline(Math.min(140, 900 / (c.name.length * 0.55)), look.ink, 700)}>{c.name}</div>
        </Reveal>
        <div style={{ fontFamily: FONT, fontSize: 48, fontWeight: 500, color: look.muted, marginTop: 26 }}>{c.job}</div>
        <div style={{ height: 2, background: look.muted, margin: '64px 0 30px', opacity: 0.6 }} />
        <div style={meta(look.muted, 28)}>Amount due</div>
        <div style={{ ...figures(150, look.ink), marginTop: 14 }}>{c.amount}</div>
        <div style={{ marginTop: 34, display: 'inline-block', padding: '14px 26px', borderRadius: 999, background: look.tag, ...meta(look.tagInk, 26), ...lift(f, 3) }}>
          Not invoiced
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** What the roll adds up to. */
const Owed: React.FC = () => {
  const f = useCurrentFrame();
  const owed = interpolate(f, [0, 16], [0, TOTAL_OWED], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: INK, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={meta(MUTED_DARK, 32)}>Owed to you</div>
      <div style={{ ...figures(250, LIME), marginTop: 30 }}>${Math.round(owed).toLocaleString('en-US')}</div>
      <div style={{ height: 3, background: MUTED_DARK, margin: '50px 0 36px', opacity: 0.6 }} />
      <div style={{ fontFamily: BRAND_FONT, fontSize: 64, fontWeight: 600, color: PAPER, letterSpacing: '-0.03em', ...lift(f, 10) }}>And not one invoice sent.</div>
    </AbsoluteFill>
  );
};

/** The music stops: a near-empty page. */
const Pause: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 90, fontWeight: 600, fontStyle: 'italic', color: INK, letterSpacing: '-0.03em', ...lift(f, 2) }}>So.</div>
    </AbsoluteFill>
  );
};

const TITLE_LOOKS = [
  { bg: PAPER, ink: INK, accent: VIOLET, dark: false },
  { bg: LIME, ink: INK, accent: INK, dark: false },
  { bg: VIOLET, ink: PAPER, accent: LIME, dark: true },
  { bg: INK, ink: LIME, accent: LIME, dark: true },
];

/** One of the four steps, numbered, with a progress rule. */
const Title: React.FC<{ i: number }> = ({ i }) => {
  const look = TITLE_LOOKS[i];
  const muted = look.dark ? MUTED_DARK : MUTED_LIGHT;
  return (
    <AbsoluteFill style={{ background: look.bg }}>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 700 }}>
        <div style={meta(muted, 32)}>Step {String(i + 1).padStart(2, '0')} / 04</div>
        <Reveal style={{ marginTop: 24 }}>
          <div style={headline(i === 3 ? 230 : 270, look.ink)}>{TITLES[i]}.</div>
        </Reveal>
        <div style={{ display: 'flex', gap: 14, marginTop: 60 }}>
          {TITLES.map((_, k) => (
            <div key={k} style={{ flex: 1, height: 10, background: k <= i ? look.accent : muted, opacity: k <= i ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A product shot: the phone, wide for two beats, then a hard cut to a closer angle for the third.
 * The close angle sits in a window between the masthead and the footer. */
const ProductStage: React.FC<{
  caption: string;
  close: { scale: number; x: number; y: number };
  children: React.ReactNode;
  bg?: string;
}> = ({ caption, close, children, bg = PAPER }) => {
  const f = useCurrentFrame();
  const closeUp = f >= BEAT * 2;
  const rise = interpolate(f, [0, 10], [70, 0], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ clipPath: closeUp ? 'inset(290px 0 350px 0)' : undefined }}>
        <AbsoluteFill
          style={{
            transformOrigin: `${close.x}px ${close.y}px`,
            scale: String(closeUp ? close.scale + (f - BEAT * 2) * 0.003 : 1 + f * 0.0012),
            translate: `0px ${closeUp ? 0 : rise}px`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, top: 230, display: 'flex', gap: 22, alignItems: 'baseline' }}>
        <span style={{ ...meta(INK, 24), padding: '8px 14px', background: bg === LIME ? PAPER : LIME }}>Fig.</span>
        <span style={{ fontFamily: FONT, fontSize: 40, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>{caption}</span>
      </div>
    </AbsoluteFill>
  );
};

// Every phone sits whole inside the frame, above the footer (bottom ≈ 1460).
const PHONE = { width: 500, left: 290, top: 330 };

const CreateShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Line items in seconds." close={{ scale: 1.75, x: 540, y: 1000 }}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <EditorLight f={f} adds={[2, 10, 18]} />
      </Phone>
    </ProductStage>
  );
};

const SignShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Signed on the spot." close={{ scale: 1.75, x: 540, y: 720 }} bg={LIME}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <SignLight f={f} drawStart={2} drawEnd={26} doneAt={30} />
      </Phone>
    </ProductStage>
  );
};

const SendShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="A PDF with a pay link." close={{ scale: 1.1, x: 540, y: 900 }}>
      <div style={{ position: 'absolute', left: 90, top: 340, scale: '0.8', transformOrigin: '0% 0%', rotate: '-3deg' }}>
        <PdfV2 payReveal={1} />
      </div>
      <Phone width={400} lightScreen shadow={PHONE_SHADOW} style={{ left: 580, top: 560, rotate: '4deg' }}>
        <ScanPay f={f} detectAt={6} sheetAt={16} payAt={30} />
      </Phone>
    </ProductStage>
  );
};

const PaidShot: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <ProductStage caption="Paid. Tracked. Done." close={{ scale: 1.75, x: 540, y: 760 }}>
      <Phone width={PHONE.width} lightScreen shadow={PHONE_SHADOW} style={{ left: PHONE.left, top: PHONE.top }}>
        <DetailLight f={f} paidAt={8} />
      </Phone>
    </ProductStage>
  );
};

/** The payoff: what you were owed, collected. */
const Collected: React.FC = () => {
  const f = useCurrentFrame();
  const amount = interpolate(f, [0, 20], [0, TOTAL_OWED], { ...CLAMP, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ background: LIME, justifyContent: 'center', padding: `0 ${MARGIN}px` }}>
      <div style={meta(INK, 32)}>Collected · 5 clients</div>
      <div style={{ ...figures(250, INK), marginTop: 30 }}>${Math.round(amount).toLocaleString('en-US')}</div>
      <div style={{ height: 12, background: INK, marginTop: 44, width: `${interpolate(f, [0, 20], [0, 100], { ...CLAMP, easing: EASE_OUT })}%` }} />
      <Reveal at={BEAT} style={{ marginTop: 40 }}>
        <div style={headline(150, INK)}>Paid in full.</div>
      </Reveal>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [4, 18], [0, 100], { ...CLAMP, easing: EASE_OUT });
  const fadeOut = interpolate(f, [len - 10, len], [0, 1], CLAMP);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <AppMark size={190} style={lift(f, 0)} />
        <div style={{ marginTop: 70, clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Img src={staticFile('brand/wordmark.svg')} style={{ width: 820, height: 820 * (51 / 331) }} />
        </div>
        <div style={{ marginTop: 70, textAlign: 'center', ...lift(f, 12) }}>
          <div style={{ fontFamily: BRAND_FONT, fontSize: 70, fontWeight: 600, color: PAPER, letterSpacing: '-0.03em' }}>You have clients?</div>
          <div style={{ fontFamily: BRAND_FONT, fontSize: 70, fontWeight: 800, color: LIME, letterSpacing: '-0.03em' }}>Invoice them.</div>
        </div>
        <div style={{ height: 2, width: 820, background: MUTED_DARK, opacity: 0.5, margin: '64px 0 50px', ...lift(f, PRICE_AT) }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, ...lift(f, PRICE_AT) }}>
          <span style={meta(MUTED_DARK, 30)}>First month</span>
          <span style={figures(150, LIME)}>$0.99</span>
        </div>
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, ...lift(f, PRICE_AT + 8) }}>
          <div style={{ padding: '24px 52px', borderRadius: 999, background: PAPER, color: INK, fontFamily: FONT, fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Download on the App Store
          </div>
          <div style={meta(MUTED_DARK, 24)}>Then $9.99/month · Cancel anytime</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', ...meta(MUTED_DARK, 24), ...lift(f, BEAT) }}>
        Powered by <span style={{ color: PAPER, fontWeight: 800 }}>NewMux</span>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const DARK_BGS: string[] = [INK, VIOLET];
const isDark = (s: Shot) =>
  s.kind === 'owed' ||
  (s.kind === 'word' && DARK_BGS.includes(WORD_LOOKS[s.i!].bg)) ||
  (s.kind === 'client' && DARK_BGS.includes(CARD_LOOKS[s.i!].bg)) ||
  (s.kind === 'title' && TITLE_LOOKS[s.i!].dark);

const renderShot = (s: Shot) => {
  switch (s.kind) {
    case 'word':
      return <Word i={s.i!} len={s.len} />;
    case 'client':
      return <ClientCard i={s.i!} />;
    case 'owed':
      return <Owed />;
    case 'pause':
      return <Pause />;
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
    case 'collected':
      return <Collected />;
    case 'end':
      return <EndCard len={s.len} />;
  }
};

export const ReelVideo: React.FC<{ music?: boolean }> = ({ music = true }) => (
  <AbsoluteFill style={{ background: INK }}>
    {SHOTS.map((s, i) => (
      <Sequence key={i} from={s.from} durationInFrames={s.len} name={`${String(i + 1).padStart(2, '0')} ${s.kind}${s.i ?? ''}`}>
        {renderShot(s)}
        {s.kind !== 'end' && s.kind !== 'pause' && <Chrome index={i} from={s.from} dark={isDark(s)} />}
      </Sequence>
    ))}
    {music && <Audio src={staticFile('audio/music-reel.wav')} />}
  </AbsoluteFill>
);
