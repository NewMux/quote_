import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, Sequence, Series, staticFile } from 'remotion';
import { CreateScene, CREATE_ADDS } from './scenes/CreateScene';
import { HookScene } from './scenes/HookScene';
import { LockupScene } from './scenes/LockupScene';
import { LogoScene } from './scenes/LogoScene';
import { FEATURES, MontageScene } from './scenes/MontageScene';
import { PaidScene, PAID } from './scenes/PaidScene';
import { MAIL_TAP, SHEET_IN, ShareScene } from './scenes/ShareScene';
import { SIGN_DRAW, SignScene } from './scenes/SignScene';
import { SummaryScene } from './scenes/SummaryScene';
import { SCENES, TOTAL_FRAMES, sceneStart } from './timing';

type Sfx = { at: number; src: string; volume: number };

// Sound effects, each placed on the frame its action happens. Whooshes start 8 frames before a
// cut so their peak lands on it.
const SFX: Sfx[] = [
  { at: sceneStart('logo') - 10, src: 'whoosh', volume: 0.5 },
  ...(['create', 'sign', 'share', 'paid', 'montage'] as const).map((s) => ({ at: sceneStart(s) - 8, src: 'whoosh', volume: 0.55 })),
  { at: sceneStart('summary') + 58, src: 'pop', volume: 0.35 },
  { at: sceneStart('summary') + 70, src: 'pop', volume: 0.3 },
  ...CREATE_ADDS.map((a) => ({ at: sceneStart('create') + a - 4, src: 'tap', volume: 0.6 })),
  { at: sceneStart('create') + 96, src: 'pop', volume: 0.35 },
  { at: sceneStart('sign') + SIGN_DRAW.start, src: 'pen', volume: 0.35 },
  { at: sceneStart('sign') + SIGN_DRAW.done, src: 'pop', volume: 0.4 },
  { at: sceneStart('share') + SHEET_IN, src: 'whoosh', volume: 0.3 },
  { at: sceneStart('share') + MAIL_TAP, src: 'tap', volume: 0.6 },
  { at: sceneStart('share') + MAIL_TAP + 2, src: 'whoosh', volume: 0.45 },
  { at: sceneStart('paid') + PAID.tap, src: 'tap', volume: 0.6 },
  { at: sceneStart('paid') + PAID.paid, src: 'chime', volume: 0.55 },
  ...FEATURES.map((_, i) => ({ at: sceneStart('montage') + 8 + i * 15, src: 'pop', volume: 0.3 })),
];

export const LaunchVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Series>
      <Series.Sequence name="Hook" durationInFrames={SCENES.hook}>
        <HookScene />
      </Series.Sequence>
      <Series.Sequence name="Logo" durationInFrames={SCENES.logo}>
        <LogoScene />
      </Series.Sequence>
      <Series.Sequence name="Summary" durationInFrames={SCENES.summary}>
        <SummaryScene />
      </Series.Sequence>
      <Series.Sequence name="Create" durationInFrames={SCENES.create}>
        <CreateScene />
      </Series.Sequence>
      <Series.Sequence name="Sign" durationInFrames={SCENES.sign}>
        <SignScene />
      </Series.Sequence>
      <Series.Sequence name="Share" durationInFrames={SCENES.share}>
        <ShareScene />
      </Series.Sequence>
      <Series.Sequence name="Paid" durationInFrames={SCENES.paid}>
        <PaidScene />
      </Series.Sequence>
      <Series.Sequence name="Montage" durationInFrames={SCENES.montage}>
        <MontageScene />
      </Series.Sequence>
      <Series.Sequence name="Lockup" durationInFrames={SCENES.lockup}>
        <LockupScene />
      </Series.Sequence>
    </Series>

    <Audio
      src={staticFile('audio/music.wav')}
      volume={(f) => interpolate(f, [0, 6, TOTAL_FRAMES - 12, TOTAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
    />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={45} name={`sfx ${s.src}`} layout="none">
        <Audio src={staticFile(`audio/${s.src}.wav`)} volume={s.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
