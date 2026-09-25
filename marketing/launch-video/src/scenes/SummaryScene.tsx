import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING, whipOut } from '../anim';
import { Background } from '../components/Background';
import { Callout } from '../components/Bits';
import { Kinetic } from '../components/Kinetic';
import { Phone } from '../components/Phone';
import { SummaryScreen } from '../screens/Screens';
import { C } from '../theme';

/** 6–10 s: the phone rises in 3D; the Summary tab counts up what you're owed. */
export const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = whipOut(frame, 120, 8);
  const rise = interpolate(frame, [0, 26], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SPRING });
  const drift = frame / 120;
  const pulse = Math.exp(-(frame % 15) / 5);
  const float = (phase: number) => Math.sin(frame / 14 + phase) * 10;

  return (
    <AbsoluteFill>
      <Background energy={1 + 0.15 * pulse} />
      <AbsoluteFill style={{ translate: `${-exit.p * 1400}px 0px`, filter: `blur(${exit.blur}px)` }}>
        <div style={{ position: 'absolute', top: 190, left: 80, right: 80 }}>
          <Kinetic text="Know what you're *owed.*" start={2} stagger={5} size={96} />
        </div>
        <Phone
          width={760}
          style={{
            left: 160,
            top: 560 + rise * 1300,
            transform: `perspective(2600px) rotateX(${14 - drift * 6 + rise * 20}deg) rotateY(${-10 + drift * 6}deg) rotateZ(${1.5 - drift * 1.5}deg)`,
          }}
        >
          <SummaryScreen f={frame - 4} />
        </Phone>
        <Callout
          icon="bell"
          color={C.orange}
          title="Reminders"
          value="On autopilot"
          style={{
            right: 30,
            top: 470 + float(2),
            opacity: interpolate(frame, [70, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            translate: `${interpolate(frame, [70, 86], [120, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })}px 0px`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
