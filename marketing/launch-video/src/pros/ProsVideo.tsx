import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, Series, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { BRAND, BRAND_FONT, TAGLINE } from '../brand';
import { ProDocument, SloppyInvoice, TextInvoice } from './graphics';
import { CARDS, END_AT, END_WORDS, SHOTS, Shot, TOTAL, VO_AT, cardSide, type Card } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// The motivational-edit layout: black frame, footage in a 3:2 band across the middle, subtitles
// over the band, and a spaced-out wordmark at its foot.
const BAND = { top: 600, height: 720 };

const GRADES: Record<NonNullable<Extract<Shot, { kind: 'clip' }>['grade']>, string> = {
  film: 'contrast(1.08) saturate(0.92)',
  warm: 'sepia(0.22) saturate(1.05) contrast(1.1) brightness(0.95)',
  cold: 'saturate(0.45) contrast(1.12) brightness(0.82) hue-rotate(-6deg)',
  mono: 'grayscale(1) contrast(1.25) brightness(0.95)',
};

const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const f = useCurrentFrame();
  if (shot.kind === 'graphic') {
    if (shot.name === 'text') return <TextInvoice />;
    if (shot.name === 'sloppy') return <SloppyInvoice />;
    return <ProDocument kind={shot.name} len={shot.len} />;
  }
  const [z0, z1] = shot.zoom ?? [1.02, 1.06];
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <OffthreadVideo
        src={staticFile(`pros/clips/${shot.src}.mp4`)}
        playbackRate={shot.rate ?? 1}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(f, [0, shot.len], [z0, z1]),
          filter: GRADES[shot.grade ?? 'film'],
        }}
      />
    </AbsoluteFill>
  );
};

/** Film grain: a fresh noise field every two frames. */
const Grain: React.FC = () => {
  const seed = Math.floor(useCurrentFrame() / 2);
  return (
    <svg width={1080} height={BAND.height} style={{ position: 'absolute', inset: 0, opacity: 0.1, mixBlendMode: 'overlay' }}>
      <filter id={`grain${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
    </svg>
  );
};

const Subtitle: React.FC<{ card: Card }> = ({ card }) => {
  const f = useCurrentFrame() + card.from;
  const side = cardSide(card);
  const small = card.words.filter((w) => !w.big);
  const big = card.words.filter((w) => w.big);
  const width = side === 'right' ? 470 : 960;
  const bigText = big.map((w) => w.text).join(' ');
  // Bricolage ExtraBold averages ~0.62em per character; size the big line to fill the width.
  const bigSize = Math.min(side === 'right' ? 120 : 190, width / (bigText.length * 0.62));
  const out = interpolate(f, [card.to - 3, card.to], [1, 0], CLAMP);
  const word = (w: { text: string; at: number; big: boolean }, size: number) => {
    const p = interpolate(f, [w.at, w.at + 5], [0, 1], { ...CLAMP, easing: EASE_OUT });
    return (
      <span
        key={`${w.text}${w.at}`}
        style={{
          display: 'inline-block',
          marginRight: size * 0.22,
          opacity: p,
          translate: `0px ${(1 - p) * size * 0.18}px`,
          scale: w.big ? interpolate(f, [w.at, w.at + 8], [1.18, 1], { ...CLAMP, easing: SPRING }) : 1,
          filter: `blur(${(1 - p) * (w.big ? 10 : 5)}px)`,
        }}
      >
        {w.text}
      </span>
    );
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: BAND.top + BAND.height / 2,
        ...(side === 'right' ? { left: 1080 - 40 - width, textAlign: 'left' } : { left: 60, right: 60, textAlign: 'center' }),
        width,
        translate: '0px -55%',
        fontFamily: BRAND_FONT,
        color: '#FFFFFF',
        textShadow: '0 4px 24px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.5)',
        opacity: out,
      }}
    >
      {small.length ? (
        <div style={{ fontSize: side === 'right' ? 46 : 56, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{small.map((w) => word(w, 56))}</div>
      ) : null}
      {big.length ? (
        <div style={{ fontSize: bigSize, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95, whiteSpace: 'nowrap' }}>{big.map((w) => word(w, bigSize))}</div>
      ) : null}
    </div>
  );
};

/** The wordmark at the foot of the band, like a channel signature. */
const Wordmark: React.FC = () => (
  <Img
    src={staticFile('brand/wordmark.svg')}
    style={{ position: 'absolute', top: BAND.top + BAND.height - 74, left: 540 - 104, width: 208, opacity: 0.9, filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.6))' }}
  />
);

/** The brand end card on Midnight Ink: the mark, then the wordmark as "Invoice Them" is spoken. */
const EndCard: React.FC = () => {
  const f = useCurrentFrame() + END_AT;
  const mark = interpolate(f, [END_AT, END_AT + 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const reveal = (at: number) => interpolate(f, [at, at + 6], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const cta = reveal(END_WORDS.them + 22);
  const fade = interpolate(f, [TOTAL - 10, TOTAL], [1, 0], CLAMP);
  // The wordmark is 331×51 (viewBox units), split into "invoice" (183) and "them" (148).
  const k = 2.75;
  const part = (file: string, w: number, at: number) => {
    const p = reveal(at);
    return (
      <Img
        src={staticFile(`brand/${file}.svg`)}
        style={{ width: w * k, height: 51 * k, opacity: p, filter: `blur(${(1 - p) * 10}px)`, translate: `0px ${(1 - p) * 24}px` }}
      />
    );
  };
  return (
    <AbsoluteFill style={{ background: BRAND.midnight, opacity: fade }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${BRAND.violet}33 0%, transparent 55%)` }} />
      <Img
        src={staticFile('brand/mark.svg')}
        style={{ position: 'absolute', left: 540 - 103, top: 560, width: 206, height: 215, opacity: mark, scale: 0.85 + mark * 0.15 }}
      />
      <div style={{ position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {part('wordmark-invoice', 183, END_WORDS.invoice)}
        {part('wordmark-them', 148, END_WORDS.them)}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1050,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: BRAND_FONT,
          color: '#A9A6C9',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.32em',
          opacity: cta,
        }}
      >
        {TAGLINE.toUpperCase()}
      </div>
      <div style={{ position: 'absolute', top: 1150, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: cta, translate: `0px ${(1 - cta) * 20}px` }}>
        <div style={{ padding: '24px 50px', borderRadius: 28, background: BRAND.lime, color: BRAND.midnight, fontFamily: BRAND_FONT, fontSize: 40, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Free on the App Store
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The music dips under each spoken card and comes back up between them. */
const musicVolume = (f: number) => {
  const speech = Math.max(
    0,
    ...CARDS.map((c) => interpolate(f, [c.from - 4, c.from, c.to, c.to + 6], [0, 1, 1, 0], CLAMP)),
    interpolate(f, [END_WORDS.invoice - 4, END_WORDS.invoice, END_WORDS.them + 12, END_WORDS.them + 22], [0, 1, 1, 0], CLAMP)
  );
  return 0.7 - 0.34 * speech;
};

/** `music` (on by default) is the song from the Bond reference edit (public/pros/music.wav, built
 * by scripts/prep-pros-footage.sh). ProsVoiceOnly leaves it out, for adding a sound in TikTok. */
export const ProsVideo: React.FC<{ music?: boolean }> = ({ music = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    <div style={{ position: 'absolute', top: BAND.top, left: 0, width: 1080, height: BAND.height, overflow: 'hidden' }}>
      <Series>
        {SHOTS.map((shot, i) => (
          <Series.Sequence key={i} durationInFrames={shot.len} name={shot.kind === 'clip' ? shot.src : shot.name}>
            <ShotView shot={shot} />
          </Series.Sequence>
        ))}
      </Series>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <Grain />
    </div>
    <Sequence durationInFrames={END_AT} layout="none">
      <Wordmark />
    </Sequence>
    {CARDS.map((card) => (
      <Sequence key={card.from} from={card.from} durationInFrames={card.to - card.from} name={card.words.map((w) => w.text).join(' ')} layout="none">
        <Subtitle card={card} />
      </Sequence>
    ))}
    <Sequence from={END_AT} name="End card">
      <EndCard />
    </Sequence>

    <Sequence from={VO_AT} layout="none" name="Voiceover">
      <Audio src={staticFile('pros/voiceover.mp3')} volume={0.85} />
    </Sequence>
    {music ? <Audio src={staticFile('pros/music.wav')} volume={musicVolume} /> : null}
  </AbsoluteFill>
);
