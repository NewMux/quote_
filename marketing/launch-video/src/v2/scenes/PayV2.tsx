import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../../anim';
import { Phone } from '../../components/Phone';
import { Canvas, Caption, SceneFade } from '../kit';
import { PdfV2, ScanPay } from '../screens';
import { ACCENT, SOFT_SHADOW } from '../theme';
import { SCENES_V2 } from '../timing';

export const PAY = { reveal: 14, phoneIn: 30, detect: 52, sheet: 78, pay: 108 };

/** 21.6–26.4 s: the PDF's Pay Online QR code; the client's phone scans it and pays. */
export const PayV2: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = interpolate(frame, [PAY.phoneIn, PAY.phoneIn + 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.pink} />
      <SceneFade duration={SCENES_V2.pay}>
        <Caption eyebrow="Payments" lines={['Every invoice has', 'a *pay link.*']} accent={ACCENT.pink} />
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 640,
            transformOrigin: '0% 0%',
            scale: 0.92,
            transform: `perspective(2600px) rotateY(${14 - frame / 30}deg)`,
            translate: `0px ${interpolate(frame, [0, 22], [80, 0], { extrapolateRight: 'clamp', easing: EASE_OUT })}px`,
          }}
        >
          <PdfV2 payReveal={interpolate(frame, [PAY.reveal, PAY.reveal + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
        </div>
        <Phone
          width={520}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{ left: 520 + phoneIn * 700, top: 900, rotate: `${-4 + phoneIn * 10}deg` }}
        >
          <ScanPay f={frame} detectAt={PAY.detect} sheetAt={PAY.sheet} payAt={PAY.pay} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};
