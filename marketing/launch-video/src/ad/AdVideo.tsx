import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, Sequence, Series, staticFile } from 'remotion';
import { CREATE_AD, CreateAd, FinaleAd, HookAd, PAY_AD, PayAd, SIGN_AD, SignAd } from './scenes';
import { SCENES_AD, TOTAL_AD, VO, startAd } from './timing';

type Sfx = { at: number; src: string; volume: number };

// Lighter than v2's: the voiceover carries the ad, so only the key moments get a sound.
const SFX: Sfx[] = [
  ...CREATE_AD.map((a) => ({ at: startAd('create') + a - 5, src: 'tap', volume: 0.35 })),
  { at: startAd('sign') + SIGN_AD.start, src: 'pen', volume: 0.22 },
  { at: startAd('sign') + SIGN_AD.done, src: 'pop', volume: 0.25 },
  { at: startAd('pay') + PAY_AD.detect, src: 'scan', volume: 0.3 },
  { at: startAd('pay') + PAY_AD.pay, src: 'tap', volume: 0.35 },
  { at: startAd('pay') + PAY_AD.pay + 6, src: 'chime', volume: 0.3 },
  { at: startAd('finale'), src: 'whoosh', volume: 0.22 },
];

const VO_LINES = VO.map((l) => ({ ...l, start: startAd(l.scene) + l.at, len: l.to - l.from }));

/** The music dips under each voiceover line and comes back up between them. */
const musicVolume = (f: number) => {
  const edges = interpolate(f, [0, 6, TOTAL_AD - 12, TOTAL_AD], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const duck = Math.max(
    0,
    ...VO_LINES.map((l) =>
      interpolate(f, [l.start - 4, l.start, l.start + l.len, l.start + l.len + 8], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    )
  );
  return edges * (0.75 - 0.4 * duck);
};

export const AdVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#F5F5F7' }}>
    <Series>
      <Series.Sequence name="Hook" durationInFrames={SCENES_AD.hook}>
        <HookAd />
      </Series.Sequence>
      <Series.Sequence name="Create" durationInFrames={SCENES_AD.create}>
        <CreateAd />
      </Series.Sequence>
      <Series.Sequence name="Sign" durationInFrames={SCENES_AD.sign}>
        <SignAd />
      </Series.Sequence>
      <Series.Sequence name="Pay" durationInFrames={SCENES_AD.pay}>
        <PayAd />
      </Series.Sequence>
      <Series.Sequence name="Finale" durationInFrames={SCENES_AD.finale}>
        <FinaleAd />
      </Series.Sequence>
    </Series>

    <Audio src={staticFile('audio/music-ad.wav')} volume={musicVolume} />
    {VO_LINES.map((l) => (
      <Sequence key={l.start} from={l.start} durationInFrames={l.len} name={`vo: ${l.text}`} layout="none">
        <Audio src={staticFile('vo/ad-voiceover.mp3')} trimBefore={l.from} trimAfter={l.to} />
      </Sequence>
    ))}
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={45} name={`sfx ${s.src}`} layout="none">
        <Audio src={staticFile(`audio/${s.src}.wav`)} volume={s.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
