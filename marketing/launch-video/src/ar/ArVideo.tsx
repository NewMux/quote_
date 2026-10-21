import React from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, Sequence, Series, staticFile } from 'remotion';
import { ChatAr, CHAT, FINALE_AR, FinaleAr, GLANCE, INVOICE, InvoiceAr, NoResultAr, GlanceAr, SearchAr } from './scenes';
import { FPS, SCENES_AR, TOTAL_AR, VOICEOVER, startAr } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Sfx = { at: number; src: string; volume: number };

const SFX: Sfx[] = [
  { at: startAr('chat') + 6, src: 'pop', volume: 0.3 },
  { at: startAr('chat') + 26, src: 'pop', volume: 0.3 },
  { at: startAr('chat') + CHAT.reply, src: 'tap', volume: 0.4 },
  { at: startAr('chat') + CHAT.card, src: 'chime', volume: 0.2 },
  { at: startAr('search'), src: 'whoosh', volume: 0.2 },
  { at: startAr('noresult') + 4, src: 'pop', volume: 0.4 },
  { at: startAr('invoice'), src: 'whoosh', volume: 0.18 },
  ...INVOICE.adds.map((a) => ({
    at: startAr('invoice') + a - 5,
    src: 'tap',
    volume: 0.35,
  })),
  { at: startAr('invoice') + INVOICE.pdf, src: 'whoosh', volume: 0.25 },
  { at: startAr('invoice') + INVOICE.pdfTag, src: 'pop', volume: 0.35 },
  { at: startAr('glance') + GLANCE.paid, src: 'pop', volume: 0.35 },
  { at: startAr('glance') + GLANCE.owed, src: 'pop', volume: 0.3 },
  { at: startAr('finale'), src: 'whoosh', volume: 0.25 },
  { at: startAr('finale') + FINALE_AR.toast, src: 'chime', volume: 0.35 },
  { at: startAr('finale') + FINALE_AR.cta, src: 'tap', volume: 0.3 },
];

/** When the voice is speaking, in seconds into the voiceover (from its transcript). */
const SPEECH: [number, number][] = [
  [0.3, 4.5],
  [5.58, 8.7],
  [9.1, 10.42],
  [10.92, 15.54],
  [15.88, 19.3],
  [19.8, 22.3],
];

/** The music dips under each spoken phrase and comes back up between them and after the last one. */
const musicVolume = (f: number) => {
  const duck = Math.max(0, ...SPEECH.map(([a, b]) => interpolate(f, [a * FPS - 6, a * FPS, b * FPS, b * FPS + 10], [0, 1, 1, 0], CLAMP)));
  const tail = interpolate(f, [22.3 * FPS, 23 * FPS], [0, 1], CLAMP);
  const edges = interpolate(f, [0, 8, TOTAL_AR - 14, TOTAL_AR], [0, 1, 1, 0], CLAMP);
  return edges * (0.78 - 0.46 * duck * (1 - tail));
};

export const ArVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#F5F5F7' }}>
    <Series>
      <Series.Sequence name="Chat" durationInFrames={SCENES_AR.chat}>
        <ChatAr />
      </Series.Sequence>
      <Series.Sequence name="Search" durationInFrames={SCENES_AR.search}>
        <SearchAr />
      </Series.Sequence>
      <Series.Sequence name="No results" durationInFrames={SCENES_AR.noresult}>
        <NoResultAr />
      </Series.Sequence>
      <Series.Sequence name="Invoice" durationInFrames={SCENES_AR.invoice}>
        <InvoiceAr />
      </Series.Sequence>
      <Series.Sequence name="At a glance" durationInFrames={SCENES_AR.glance}>
        <GlanceAr />
      </Series.Sequence>
      <Series.Sequence name="Finale" durationInFrames={SCENES_AR.finale}>
        <FinaleAr />
      </Series.Sequence>
    </Series>

    <Audio src={staticFile('audio/music-ar.wav')} volume={musicVolume} />
    <Audio src={staticFile(VOICEOVER)} />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={45} name={`sfx ${s.src}`} layout="none">
        <Audio src={staticFile(`audio/${s.src}.wav`)} volume={s.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
