import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_IN_OUT } from '../anim2';
import { Phone } from '../../components/Phone';
import { Canvas, Caption, SceneFade } from '../kit';
import { PdfV2, SignLight } from '../screens';
import { FONT } from '../../theme';
import { ACCENT, L, SOFT_SHADOW } from '../theme';
import { SCENES_V2 } from '../timing';

export const SIGN = { start: 18, end: 62, done: 68, toPdf: 84 };

/** 16.8–21.6 s: sign on the phone, then the same signature lands large on the PDF. */
export const SignV2: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = interpolate(frame, [SIGN.toPdf, SIGN.toPdf + 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.violet} />
      <SceneFade duration={SCENES_V2.sign}>
        <Caption eyebrow="Signatures" lines={['Signed on the spot.', '*Big and clear.*']} accent={ACCENT.violet} />
        <Phone
          width={740}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{
            left: 170 - swap * 520,
            top: 660 + swap * 120,
            opacity: 1 - swap,
            scale: 1 - swap * 0.25,
            transform: `perspective(2600px) rotateX(6deg) rotateY(${swap * 20}deg)`,
          }}
        >
          <SignLight f={frame} drawStart={SIGN.start} drawEnd={SIGN.end} doneAt={SIGN.done} />
        </Phone>
        {/* A magnified window onto the PDF's signature line: the same signature, printed large. */}
        <div
          style={{
            position: 'absolute',
            left: 70,
            top: 820,
            width: 940,
            height: 400,
            borderRadius: 44,
            overflow: 'hidden',
            background: '#FFFFFF',
            boxShadow: '0 40px 90px rgba(17,17,20,0.18)',
            translate: `${(1 - swap) * 1000}px 0px`,
            rotate: `${(1 - swap) * 6}deg`,
            opacity: swap,
          }}
        >
          <div style={{ position: 'absolute', left: -60, top: -1130, scale: 1.7, transformOrigin: '0 0' }}>
            <PdfV2 signature={interpolate(frame, [SIGN.toPdf + 16, SIGN.toPdf + 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} payReveal={0} />
          </div>
          <div style={{ position: 'absolute', left: 40, top: 34, fontFamily: FONT, fontSize: 30, fontWeight: 600, color: L.secondary }}>
            On your invoice PDF
          </div>
        </div>
      </SceneFade>
    </AbsoluteFill>
  );
};
