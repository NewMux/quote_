import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { AppMark } from '../components/Bits';
import { Icon } from '../components/Icon';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { Canvas, Caption, LineReveal, NightCanvas, SceneFade } from '../v2/kit';
import { EditorLight, PdfV2, ScanPay, SignLight } from '../v2/screens';
import { ACCENT, NIGHT, SOFT_SHADOW } from '../v2/theme';
import { HookV2 } from '../v2/scenes/HookV2';
import { SCENES_AD } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Captions sit lower than v2's (top 150) to clear the Reels / TikTok top bar.
const CAPTION_TOP = 230;
const PHONE_TOP = 720;

/** 0–3 s: v2's spreadsheet hook, sped up to the voiceover. */
export const HookAd: React.FC = () => <HookV2 fallAt={56} outAt={66} />;

export const CREATE_AD = [12, 26, 40];

/** 3–5.4 s: three taps, three line items. */
export const CreateAd: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 20], [1, 0], { ...CLAMP, easing: SPRING });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.blue} />
      <SceneFade duration={SCENES_AD.create} inLen={6} outLen={6}>
        <Caption eyebrow="Invoices" lines={['Create an invoice', 'in *seconds.*']} accent={ACCENT.blue} at={0} top={CAPTION_TOP} />
        <Phone
          width={740}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{ left: 170, top: PHONE_TOP + rise * 700, transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${-5 + frame / 40}deg)` }}
        >
          <EditorLight f={frame} adds={CREATE_AD} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};

export const SIGN_AD = { start: 8, end: 38, done: 42 };

/** 5.4–7.8 s: the client signs on the phone. */
export const SignAd: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.violet} />
      <SceneFade duration={SCENES_AD.sign} inLen={6} outLen={6}>
        <Caption eyebrow="Signatures" lines={['Signed', '*on the spot.*']} accent={ACCENT.violet} at={0} top={CAPTION_TOP} />
        <Phone
          width={740}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{ left: 170, top: PHONE_TOP, transform: `perspective(2600px) rotateX(6deg) rotateY(${4 - frame / 40}deg)` }}
        >
          <SignLight f={frame} drawStart={SIGN_AD.start} drawEnd={SIGN_AD.end} doneAt={SIGN_AD.done} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};

export const PAY_AD = { phoneIn: 0, detect: 18, sheet: 30, pay: 44 };

/** 7.8–10.2 s: the client scans the invoice's QR code and pays. */
export const PayAd: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = interpolate(frame, [PAY_AD.phoneIn, PAY_AD.phoneIn + 16], [1, 0], { ...CLAMP, easing: SPRING });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.pink} />
      <SceneFade duration={SCENES_AD.pay} inLen={6} outLen={6}>
        <Caption eyebrow="Payments" lines={['Scan.', '*Pay.* Done.']} accent={ACCENT.pink} at={0} top={CAPTION_TOP} />
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: PHONE_TOP - 20,
            transformOrigin: '0% 0%',
            scale: 0.92,
            transform: `perspective(2600px) rotateY(${12 - frame / 20}deg)`,
            translate: `0px ${interpolate(frame, [0, 16], [80, 0], { ...CLAMP, easing: EASE_OUT })}px`,
          }}
        >
          <PdfV2 payReveal={1} />
        </div>
        <Phone width={520} lightScreen shadow={SOFT_SHADOW} style={{ left: 520 + phoneIn * 700, top: 940, rotate: `${-4 + phoneIn * 10}deg` }}>
          <ScanPay f={frame} detectAt={PAY_AD.detect} sheetAt={PAY_AD.sheet} payAt={PAY_AD.pay} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};

/** 10.2–14.4 s: the end card on midnight, with the call to action. */
export const FinaleAd: React.FC = () => {
  const frame = useCurrentFrame();
  const end = SCENES_AD.finale;
  const open = interpolate(frame, [0, 16], [0, 1250], { ...CLAMP, easing: EASE_OUT });
  const fade = interpolate(frame, [end - 12, end], [0, 1], CLAMP);
  const shine = interpolate(frame % 54, [10, 40], [-0.3, 1.3], CLAMP);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.pink} />
      <AbsoluteFill style={{ clipPath: `circle(${open}px at 50% 50%)` }}>
        <NightCanvas intensity={1} />
        <AbsoluteFill style={{ scale: interpolate(frame, [0, end], [1, 1.04]) }}>
          <div
            style={{
              position: 'absolute',
              left: 540 - 360,
              top: 600 - 360,
              width: 720,
              height: 720,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(185,169,255,0.28) 0%, transparent 62%)',
            }}
          />
          <AppMark
            size={240}
            style={{
              position: 'absolute',
              left: 540 - 120,
              top: 480,
              scale: interpolate(frame, [4, 24], [0.6, 1], { ...CLAMP, easing: SPRING, output: 'perceptual-scale' }),
              opacity: interpolate(frame, [4, 10], [0, 1], CLAMP),
            }}
          />
          <div style={{ position: 'absolute', top: 780, left: 60, right: 60 }}>
            <LineReveal lines={['Invoice Them']} accent="#B9A9FF" at={10} size={130} weight={900} color={NIGHT.ink} />
            <div style={{ height: 30 }} />
            <LineReveal lines={['Get paid, *simply.*']} accent="#B9A9FF" at={20} size={60} weight={600} color={NIGHT.secondary} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 1170,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity: interpolate(frame, [38, 46], [0, 1], CLAMP),
              translate: `0px ${interpolate(frame, [38, 54], [30, 0], { ...CLAMP, easing: EASE_OUT })}px`,
            }}
          >
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '28px 54px',
                borderRadius: 999,
                background: '#FFFFFF',
                color: '#0B0D17',
                fontFamily: FONT,
                fontSize: 48,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                boxShadow: '0 20px 60px rgba(123,97,255,0.35)',
              }}
            >
              <Icon name="download" size={44} color="#0B0D17" weight={2.6} />
              Get it on the App Store
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  bottom: -40,
                  width: 110,
                  left: `${shine * 100}%`,
                  rotate: '20deg',
                  background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.22), transparent)',
                }}
              />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 1330,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 500,
              color: NIGHT.secondary,
              opacity: interpolate(frame, [50, 62], [0, 1], CLAMP),
            }}
          >
            Try it free for a week
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: fade }} />
    </AbsoluteFill>
  );
};
