import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, Sequence, Series, staticFile } from 'remotion';
import { BENTO, BentoV2 } from './scenes/BentoV2';
import { CONTACTS, ContactsV2 } from './scenes/ContactsV2';
import { CREATE_ADDS, CreateV2 } from './scenes/CreateV2';
import { FinaleV2 } from './scenes/FinaleV2';
import { HookV2 } from './scenes/HookV2';
import { IntroV2 } from './scenes/IntroV2';
import { NightV2 } from './scenes/NightV2';
import { PAID, PaidV2 } from './scenes/PaidV2';
import { PAY, PayV2 } from './scenes/PayV2';
import { SIGN, SignV2 } from './scenes/SignV2';
import { SCENES_V2, TOTAL_V2, startV2 } from './timing';

type Sfx = { at: number; src: string; volume: number };

// Gentle, sparse sound design: each effect marks something the viewer is watching happen.
const SFX: Sfx[] = [
  ...CREATE_ADDS.map((a) => ({ at: startV2('create') + a - 5, src: 'tap', volume: 0.45 })),
  { at: startV2('create') + 112, src: 'pop', volume: 0.28 },
  { at: startV2('contacts') + CONTACTS.tapFill, src: 'tap', volume: 0.45 },
  { at: startV2('contacts') + CONTACTS.sheetUp, src: 'whoosh', volume: 0.18 },
  { at: startV2('contacts') + CONTACTS.tapRow, src: 'tap', volume: 0.45 },
  { at: startV2('contacts') + CONTACTS.fill, src: 'pop', volume: 0.3 },
  { at: startV2('sign') + SIGN.start, src: 'pen', volume: 0.28 },
  { at: startV2('sign') + SIGN.done, src: 'pop', volume: 0.3 },
  { at: startV2('sign') + SIGN.toPdf, src: 'whoosh', volume: 0.22 },
  { at: startV2('pay') + PAY.phoneIn, src: 'whoosh', volume: 0.18 },
  { at: startV2('pay') + PAY.detect, src: 'scan', volume: 0.4 },
  { at: startV2('pay') + PAY.sheet - 6, src: 'tap', volume: 0.45 },
  { at: startV2('pay') + PAY.pay, src: 'tap', volume: 0.45 },
  { at: startV2('pay') + PAY.pay + 6, src: 'chime', volume: 0.35 },
  { at: startV2('paid') + PAID.banner, src: 'pop', volume: 0.3 },
  { at: startV2('paid') + PAID.stat, src: 'pop', volume: 0.25 },
  ...BENTO.map((_, i) => ({ at: startV2('bento') + 20 + i * 9, src: 'pop', volume: 0.18 })),
  { at: startV2('night'), src: 'whoosh', volume: 0.25 },
];

export const LaunchVideoV2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#F5F5F7' }}>
    <Series>
      <Series.Sequence name="Hook" durationInFrames={SCENES_V2.hook}>
        <HookV2 />
      </Series.Sequence>
      <Series.Sequence name="Intro" durationInFrames={SCENES_V2.intro}>
        <IntroV2 />
      </Series.Sequence>
      <Series.Sequence name="Create" durationInFrames={SCENES_V2.create}>
        <CreateV2 />
      </Series.Sequence>
      <Series.Sequence name="Contacts" durationInFrames={SCENES_V2.contacts}>
        <ContactsV2 />
      </Series.Sequence>
      <Series.Sequence name="Sign" durationInFrames={SCENES_V2.sign}>
        <SignV2 />
      </Series.Sequence>
      <Series.Sequence name="Pay" durationInFrames={SCENES_V2.pay}>
        <PayV2 />
      </Series.Sequence>
      <Series.Sequence name="Paid" durationInFrames={SCENES_V2.paid}>
        <PaidV2 />
      </Series.Sequence>
      <Series.Sequence name="Bento" durationInFrames={SCENES_V2.bento}>
        <BentoV2 />
      </Series.Sequence>
      <Series.Sequence name="Night" durationInFrames={SCENES_V2.night}>
        <NightV2 />
      </Series.Sequence>
      <Series.Sequence name="Finale" durationInFrames={SCENES_V2.finale}>
        <FinaleV2 />
      </Series.Sequence>
    </Series>

    <Audio
      src={staticFile('audio/music-v2.wav')}
      volume={(f) => interpolate(f, [0, 6, TOTAL_V2 - 12, TOTAL_V2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
    />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={45} name={`sfx ${s.src}`} layout="none">
        <Audio src={staticFile(`audio/${s.src}.wav`)} volume={s.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
