import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, Series, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { AppMark } from '../components/Bits';
import { FONT } from '../theme';
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
  // Inter Black averages ~0.62em per character; size the big line to fill the width.
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
        fontFamily: FONT,
        color: '#FFFFFF',
        textShadow: '0 4px 24px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.5)',
        opacity: out,
      }}
    >
      {small.length ? (
        <div style={{ fontSize: side === 'right' ? 46 : 56, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{small.map((w) => word(w, 56))}</div>
      ) : null}
      {big.length ? (
        <div style={{ fontSize: bigSize, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.95, whiteSpace: 'nowrap' }}>{big.map((w) => word(w, bigSize))}</div>
      ) : null}
    </div>
  );
};

/** The spaced wordmark at the foot of the band, like a channel signature. */
const Wordmark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: BAND.top + BAND.height - 68,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: '0.42em',
      color: 'rgba(255,255,255,0.82)',
      textShadow: '0 1px 8px rgba(0,0,0,0.6)',
    }}
  >
    INVOICE THEM
  </div>
);

/** "Invoice Them." on black, then the call to action. */
const EndCard: React.FC = () => {
  const f = useCurrentFrame() + END_AT;
  const mark = interpolate(f, [END_AT, END_AT + 14], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const reveal = (at: number) => interpolate(f, [at, at + 6], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const cta = reveal(END_WORDS.them + 22);
  const fade = interpolate(f, [TOTAL - 10, TOTAL], [1, 0], CLAMP);
  return (
    <AbsoluteFill style={{ background: '#000', opacity: fade }}>
      <AppMark size={210} style={{ position: 'absolute', left: 540 - 105, top: 610, opacity: mark, scale: 0.85 + mark * 0.15 }} />
      <div style={{ position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, color: '#fff', fontWeight: 900, fontSize: 140, letterSpacing: '-0.045em' }}>
        {[
          ['Invoice', END_WORDS.invoice],
          ['Them.', END_WORDS.them],
        ].map(([w, at]) => {
          const p = reveal(at as number);
          return (
            <span key={w} style={{ display: 'inline-block', margin: '0 18px', opacity: p, filter: `blur(${(1 - p) * 10}px)`, translate: `0px ${(1 - p) * 24}px` }}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 1080, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, color: 'rgba(255,255,255,0.7)', fontSize: 40, fontWeight: 500, opacity: cta }}>
        Estimates &amp; invoices that look the part.
      </div>
      <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: cta, translate: `0px ${(1 - cta) * 20}px` }}>
        <div style={{ padding: '22px 46px', borderRadius: 999, background: '#fff', color: '#000', fontFamily: FONT, fontSize: 38, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Free on the App Store
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Voiceover only: the music gets added in TikTok. `withMusic` mixes in a reference track for
 * checking the cut against it (never for posting). */
export const ProsVideo: React.FC<{ withMusic?: boolean }> = ({ withMusic }) => (
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
      <Audio src={staticFile('pros/voiceover.mp3')} />
    </Sequence>
    {withMusic ? <Audio src={staticFile('pros/reference-music.wav')} volume={0.35} loop /> : null}
  </AbsoluteFill>
);
