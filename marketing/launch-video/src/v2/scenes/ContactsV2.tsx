import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { SPRING } from '../../anim';
import { Phone } from '../../components/Phone';
import { Canvas, Caption, SceneFade } from '../kit';
import { ContactsSheet, NewClientLight } from '../screens';
import { ACCENT, SOFT_SHADOW } from '../theme';
import { SCENES_V2 } from '../timing';

export const CONTACTS = { tapFill: 30, sheetUp: 36, tapRow: 74, sheetDown: 80, fill: 96 };

/** 12–16.8 s: "Fill from Contacts" → the contact picker → every field fills itself. */
export const ContactsV2: React.FC = () => {
  const frame = useCurrentFrame();
  const up = interpolate(frame, [CONTACTS.sheetUp, CONTACTS.sheetUp + 16], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING });
  const down = interpolate(frame, [CONTACTS.sheetDown, CONTACTS.sheetDown + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.orange} />
      <SceneFade duration={SCENES_V2.contacts}>
        <Caption eyebrow="Clients" lines={['Add clients from', 'your *contacts.*']} accent={ACCENT.orange} />
        <Phone width={740} lightScreen shadow={SOFT_SHADOW} style={{ left: 170, top: 660, transform: `perspective(2600px) rotateX(6deg) rotateY(${4 - frame / 60}deg)` }}>
          <NewClientLight f={frame} tapAt={CONTACTS.tapFill} fillAt={CONTACTS.fill} />
          {frame >= CONTACTS.sheetUp && frame < CONTACTS.sheetDown + 16 ? <ContactsSheet y={Math.max(up, down)} f={frame} tapAt={CONTACTS.tapRow} /> : null}
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};
