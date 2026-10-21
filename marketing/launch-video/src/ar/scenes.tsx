import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { EASE_OUT, SPRING } from '../anim';
import { BRAND } from '../brand';
import { AppMark, Burst } from '../components/Bits';
import { Icon } from '../components/Icon';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { Canvas, NightCanvas, SceneFade } from '../v2/kit';
import { EditorLight, PdfV2 } from '../v2/screens';
import { ACCENT, NIGHT, SOFT_SHADOW } from '../v2/theme';
import { AR_FONT, ArCaption } from './kit';
import { ChatScreen, InvoiceList, Magnifier, OWED_TOTAL, PAID_TOTAL, SearchScreen } from './screens';
import { CAPTIONS, FINALE, FPS, SCENES_AR, inScene } from './timing';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Captions sit below the Reels / TikTok top bar; the phone rises from the bottom edge.
const CAPTION_TOP = 210;
const PHONE_TOP = 760;
const PHONE_W = 740;
const PHONE_LEFT = (1080 - PHONE_W) / 2;

/** A white floating card (right to left): an icon tile, a label and a value. Pops in at `at`. */
const Card: React.FC<{
  at: number;
  color: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  style?: React.CSSProperties;
}> = ({ at, color, icon, title, value, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 16], [0, 1], {
    ...CLAMP,
    easing: SPRING,
  });
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 24px 20px 34px',
        borderRadius: 34,
        background: '#FFFFFF',
        boxShadow: '0 30px 60px rgba(17,17,20,0.18)',
        fontFamily: AR_FONT,
        opacity: interpolate(frame - at, [0, 5], [0, 1], CLAMP),
        scale: interpolate(p, [0, 1], [0.7, 1]),
        translate: `0px ${(1 - p) * 40}px`,
        ...style,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 30,
            color: '#6E6E73',
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 900,
            color: '#111114',
            lineHeight: 1.15,
            fontFamily: FONT,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

const phoneRise = (frame: number) => interpolate(frame, [0, 22], [1, 0], { ...CLAMP, easing: SPRING });

// ---------------------------------------------------------------------------------------------

export const CHAT = { type: 55, reply: 88, read: 106, card: 112 };

/** 0–5.4 s: the job is done, and the client says the money is on its way. */
export const ChatAr: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SCENES_AR.chat;
  const rise = phoneRise(frame);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.green} />
      <SceneFade duration={d} inLen={4} outLen={6}>
        <ArCaption scene="chat" lines={CAPTIONS.chat} accent={ACCENT.green} top={CAPTION_TOP} size={104} duration={d} />
        <Phone
          width={PHONE_W}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{
            left: PHONE_LEFT,
            top: PHONE_TOP + rise * 700,
            transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${-5 + frame / 40}deg)`,
          }}
        >
          <ChatScreen f={frame} typeAt={CHAT.type} replyAt={CHAT.reply} readAt={CHAT.read} />
        </Phone>
        <Card
          at={CHAT.card}
          color={ACCENT.green}
          icon={
            <span
              style={{
                fontFamily: FONT,
                fontSize: 42,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              $
            </span>
          }
          title="بانتظار التحويل"
          value="$4,290.00"
          style={{ left: 120, top: 1590 }}
        />
      </SceneFade>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

/** 5.4–9 s: "two months" of scrolling through a chat app looking for one invoice. */
export const SearchAr: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SCENES_AR.search;
  const rise = phoneRise(frame);
  const days = Math.round(interpolate(frame, [inScene('search', 5.76), inScene('search', 6.5)], [1, 60], { ...CLAMP, easing: EASE_OUT }));
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.orange} />
      <SceneFade duration={d} inLen={4} outLen={6}>
        <ArCaption scene="search" lines={CAPTIONS.search} accent={ACCENT.orange} top={CAPTION_TOP} size={104} duration={d} />
        <Phone
          width={PHONE_W}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{
            left: PHONE_LEFT,
            top: PHONE_TOP + rise * 700,
            transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${4 - frame / 40}deg)`,
          }}
        >
          <SearchScreen f={frame} typeStart={8} typeEnd={44} />
        </Phone>
        <Card
          at={inScene('search', 5.76)}
          color={ACCENT.orange}
          icon={<Icon name="clock" size={42} color="#fff" weight={2.6} />}
          title="مضى"
          value={`${days} يوم`}
          style={{ right: 70, top: 1480 }}
        />
      </SceneFade>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const QUESTIONS = [
  { x: 90, y: 560, s: 150, c: ACCENT.red, d: 0 },
  { x: 800, y: 600, s: 190, c: ACCENT.orange, d: 4 },
  { x: 130, y: 1380, s: 210, c: ACCENT.orange, d: 8 },
  { x: 780, y: 1420, s: 150, c: ACCENT.red, d: 12 },
];

/** 9–10.8 s: nothing found. "Did I send him the invoice or not?" */
export const NoResultAr: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SCENES_AR.noresult;
  const card = interpolate(frame, [0, 16], [0, 1], {
    ...CLAMP,
    easing: SPRING,
  });
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.red} />
      <SceneFade duration={d} inLen={4} outLen={5}>
        <ArCaption scene="noresult" lines={CAPTIONS.noresult} accent={ACCENT.red} top={CAPTION_TOP} size={112} duration={d} outLen={4} />
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            left: 90,
            right: 90,
            top: 740,
            padding: '34px 40px 70px',
            borderRadius: 56,
            background: '#FFFFFF',
            boxShadow: SOFT_SHADOW,
            fontFamily: AR_FONT,
            opacity: card,
            scale: interpolate(card, [0, 1], [0.86, 1]),
            translate: `0px ${(1 - card) * 60}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '0 28px',
              height: 104,
              borderRadius: 30,
              background: '#EDEDF0',
              fontSize: 46,
              fontWeight: 700,
            }}
          >
            <Magnifier size={46} />
            فاتورة لينا
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 70,
            }}
          >
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: 95,
                background: 'rgba(255,59,48,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scale: interpolate(frame, [8, 24], [0.6, 1], {
                  ...CLAMP,
                  easing: SPRING,
                }),
              }}
            >
              <Magnifier size={96} color={ACCENT.red} weight={2.2} />
            </div>
            <div style={{ fontSize: 66, fontWeight: 900, marginTop: 34 }}>لا توجد نتائج</div>
          </div>
        </div>
        {QUESTIONS.map((q) => {
          const p = interpolate(frame - q.d, [0, 16], [0, 1], {
            ...CLAMP,
            easing: SPRING,
          });
          return (
            <div
              key={q.x}
              style={{
                position: 'absolute',
                left: q.x,
                top: q.y,
                width: q.s,
                height: q.s,
                borderRadius: q.s / 2,
                background: '#FFFFFF',
                boxShadow: '0 24px 50px rgba(17,17,20,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: AR_FONT,
                fontSize: q.s * 0.72,
                fontWeight: 900,
                lineHeight: 1,
                color: q.c,
                paddingBottom: q.s * 0.08,
                scale: interpolate(p, [0, 1], [0.3, 1]),
                opacity: interpolate(frame - q.d, [0, 5], [0, 1], CLAMP),
                translate: `0px ${Math.sin((frame + q.d * 3) / 7) * 10}px`,
                rotate: `${(q.x % 2 ? 1 : -1) * 10}deg`,
              }}
            >
              ؟
            </div>
          );
        })}
      </SceneFade>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

export const INVOICE = { adds: [24, 44, 64], pdf: 82, pdfTag: 108, name: 128 };

/** 10.8–15.6 s: fill in the blanks on the phone, and a PDF invoice in the user's name comes out. */
export const InvoiceAr: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SCENES_AR.invoice;
  const rise = phoneRise(frame);
  const out = interpolate(frame, [INVOICE.pdf - 6, INVOICE.pdf + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const pdf = interpolate(frame, [INVOICE.pdf, INVOICE.pdf + 22], [0, 1], {
    ...CLAMP,
    easing: SPRING,
  });
  const tag = interpolate(frame, [INVOICE.pdfTag, INVOICE.pdfTag + 12], [0, 1], { ...CLAMP, easing: SPRING });
  const ring = interpolate(frame, [INVOICE.name, INVOICE.name + 10], [0, 1], {
    ...CLAMP,
    easing: SPRING,
  });
  const pulse = 1 + 0.03 * Math.sin((frame - INVOICE.name) / 4);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.blue} />
      <SceneFade duration={d} inLen={4} outLen={5}>
        <ArCaption scene="invoice" lines={CAPTIONS.invoice} accent={ACCENT.blue} top={CAPTION_TOP} size={78} duration={d} outLen={4} />
        <Phone
          width={PHONE_W}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{
            left: PHONE_LEFT - out * 420,
            top: PHONE_TOP + 30 + rise * 700 + out * 260,
            opacity: 1 - out,
            transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${-5 + frame / 40 - out * 25}deg)`,
          }}
        >
          <EditorLight f={frame} adds={INVOICE.adds} />
        </Phone>
        <div
          style={{
            position: 'absolute',
            left: 220,
            top: 700,
            opacity: pdf,
            transformOrigin: '50% 50%',
            transform: `perspective(2600px) rotateY(${(1 - pdf) * -28 + 2}deg) rotateX(${(1 - pdf) * 10}deg) scale(${1.03})`,
            translate: `0px ${(1 - pdf) * 220}px`,
          }}
        >
          <PdfV2 payReveal={1} />
          <div
            style={{
              position: 'absolute',
              left: 28,
              top: 30,
              width: 330,
              height: 72,
              borderRadius: 20,
              border: `5px solid ${ACCENT.blue}`,
              boxShadow: `0 0 0 10px ${ACCENT.blue}26`,
              opacity: ring,
              scale: ring * pulse,
            }}
          />
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              left: 16,
              top: -78,
              padding: '10px 28px 14px',
              borderRadius: 999,
              background: ACCENT.blue,
              color: '#fff',
              fontFamily: AR_FONT,
              fontSize: 42,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 14px 30px rgba(47,107,255,0.4)',
              opacity: ring,
              scale: interpolate(ring, [0, 1], [0.7, 1]),
              transformOrigin: '0% 0%',
            }}
          >
            باسمك وشعارك
          </div>
          <div
            style={{
              position: 'absolute',
              right: -34,
              top: -54,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 28px',
              borderRadius: 24,
              background: '#E5322D',
              color: '#fff',
              fontFamily: FONT,
              fontSize: 54,
              fontWeight: 900,
              boxShadow: '0 20px 40px rgba(229,50,45,0.4)',
              opacity: tag,
              scale: interpolate(tag, [0, 1], [0.5, 1]),
              rotate: `${interpolate(tag, [0, 1], [-20, 7])}deg`,
            }}
          >
            <Icon name="doc" size={52} color="#fff" weight={2.4} />
            PDF
          </div>
        </div>
      </SceneFade>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

export const GLANCE = {
  paid: inScene('glance', 17.5),
  owed: inScene('glance', 18.44),
};

/** 15.6–19.8 s: who paid and who still owes, at a glance. */
export const GlanceAr: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SCENES_AR.glance;
  const rise = phoneRise(frame);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.indigo} />
      <SceneFade duration={d} inLen={4} outLen={6}>
        <ArCaption scene="glance" lines={CAPTIONS.glance} accent={ACCENT.indigo} top={CAPTION_TOP} size={92} duration={d} />
        <Card
          at={GLANCE.paid}
          color={ACCENT.green}
          icon={<Icon name="check" size={44} color="#fff" weight={3.4} />}
          title="دفعوا"
          value={'$' + PAID_TOTAL.toLocaleString('en-US')}
          style={{ right: 56, top: 560 }}
        />
        <Card
          at={GLANCE.owed}
          color={ACCENT.orange}
          icon={<Icon name="clock" size={42} color="#fff" weight={2.8} />}
          title="باقي عليهم"
          value={'$' + OWED_TOTAL.toLocaleString('en-US')}
          style={{ left: 56, top: 560 }}
        />
        <Phone
          width={PHONE_W}
          lightScreen
          shadow={SOFT_SHADOW}
          style={{
            left: PHONE_LEFT,
            top: PHONE_TOP + 40 + rise * 700,
            transform: `perspective(2600px) rotateX(${6 + rise * 14}deg) rotateY(${3 - frame / 50}deg)`,
          }}
        >
          <InvoiceList f={frame} paidAt={GLANCE.paid} owedAt={GLANCE.owed} />
        </Phone>
      </SceneFade>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const sec = (s: number) => Math.round((s - FINALE.invoice) * FPS);

export const FINALE_AR = {
  invoice: sec(FINALE.invoice),
  them: sec(FINALE.them),
  toast: sec(FINALE.reaches) + 8,
  cta: sec(22.6),
};

/** 19.8–24 s: the end card on Midnight Ink: "Invoice Them. Your money reaches you." */
export const FinaleAr: React.FC = () => {
  const frame = useCurrentFrame();
  const end = SCENES_AR.finale;
  const open = interpolate(frame, [0, 16], [0, 1300], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const fade = interpolate(frame, [end - 10, end], [0, 1], CLAMP);
  const reveal = (at: number) => interpolate(frame, [at, at + 7], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const part = (file: string, w: number, at: number) => {
    const p = reveal(at);
    const k = 2.6;
    return (
      <Img
        src={staticFile(`brand/${file}.svg`)}
        style={{
          width: w * k,
          height: 51 * k,
          opacity: p,
          filter: `blur(${(1 - p) * 10}px)`,
          translate: `0px ${(1 - p) * 24}px`,
        }}
      />
    );
  };
  const toast = interpolate(frame, [FINALE_AR.toast, FINALE_AR.toast + 16], [0, 1], { ...CLAMP, easing: SPRING });
  const cta = interpolate(frame, [FINALE_AR.cta, FINALE_AR.cta + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const shine = interpolate((frame - FINALE_AR.cta) % 60, [10, 40], [-0.3, 1.3], CLAMP);
  return (
    <AbsoluteFill>
      <Canvas accent={ACCENT.indigo} />
      <AbsoluteFill style={{ clipPath: `circle(${open}px at 50% 38%)` }}>
        <NightCanvas intensity={1} />
        <AbsoluteFill style={{ scale: interpolate(frame, [0, end], [1, 1.035]) }}>
          <div
            style={{
              position: 'absolute',
              left: 540 - 380,
              top: 520 - 380,
              width: 760,
              height: 760,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(185,169,255,0.28) 0%, transparent 62%)',
            }}
          />
          <AppMark
            size={210}
            style={{
              position: 'absolute',
              left: 540 - 105,
              top: 300,
              scale: interpolate(frame, [2, 22], [0.6, 1], {
                ...CLAMP,
                easing: SPRING,
                output: 'perceptual-scale',
              }),
              opacity: interpolate(frame, [2, 8], [0, 1], CLAMP),
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 590,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {part('wordmark-invoice', 183, FINALE_AR.invoice + 2)}
            {part('wordmark-them', 148, FINALE_AR.them)}
          </div>
          <ArCaption
            scene="finale"
            lines={[
              [
                { text: 'فلوسك', at: FINALE.money },
                { text: '*توصلك', at: FINALE.reaches },
              ],
            ]}
            accent={BRAND.lime}
            color="#FFFFFF"
            top={780}
            size={150}
            duration={end}
            outLen={0}
          />
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              left: 110,
              right: 110,
              top: 1130,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '26px 34px',
              borderRadius: 40,
              background: 'rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.14), 0 30px 70px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              fontFamily: AR_FONT,
              opacity: toast,
              scale: interpolate(toast, [0, 1], [0.85, 1]),
              translate: `0px ${(1 - toast) * -50}px`,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                background: BRAND.lime,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={48} color={BRAND.midnight} weight={3.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.3,
                }}
              >
                تم استلام الدفعة
              </div>
              <div
                dir="ltr"
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  color: NIGHT.secondary,
                  lineHeight: 1.3,
                  textAlign: 'right',
                  fontFamily: FONT,
                }}
              >
                Harbor Coffee Co.
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 58,
                fontWeight: 800,
                color: BRAND.lime,
                letterSpacing: '-0.02em',
              }}
              dir="ltr"
            >
              +$4,290
            </div>
          </div>
          <Burst at={FINALE_AR.toast + 6} x={540} y={1170} count={26} spread={420} colors={[BRAND.lime, '#B9A9FF', '#FFFFFF', ACCENT.pink, ACCENT.blue]} />
          <div
            style={{
              position: 'absolute',
              top: 1420,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              opacity: cta,
              translate: `0px ${(1 - cta) * 30}px`,
            }}
          >
            <div
              dir="rtl"
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '24px 60px 30px',
                borderRadius: 999,
                background: BRAND.lime,
                color: BRAND.midnight,
                fontFamily: AR_FONT,
                fontSize: 58,
                fontWeight: 900,
                boxShadow: '0 20px 60px rgba(200,242,58,0.3)',
              }}
            >
              <Icon name="download" size={56} color={BRAND.midnight} weight={2.8} />
              حمّله من App Store
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  bottom: -40,
                  width: 110,
                  left: `${shine * 100}%`,
                  rotate: '20deg',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                }}
              />
            </div>
          </div>
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              top: 1585,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: AR_FONT,
              fontSize: 42,
              fontWeight: 700,
              color: NIGHT.secondary,
              opacity: interpolate(frame, [FINALE_AR.cta + 8, FINALE_AR.cta + 20], [0, 1], CLAMP),
            }}
          >
            جرّبه مجاناً لمدة أسبوع
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: fade }} />
    </AbsoluteFill>
  );
};
