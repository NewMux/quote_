import React from 'react';
import { interpolate } from 'remotion';
import { EASE_OUT, SPRING, clampInterp } from '../anim';
import { Icon } from '../components/Icon';
import { FONT } from '../theme';
import { Avatar, Circle, Screen, Section } from '../v2/screens';
import { ACCENT, IOS } from '../v2/theme';
import { AR_FONT } from './kit';

// Phone screens for the Arabic promo, in iOS points (393×852). `f` is the scene's local frame.
// The chat and search screens are a generic messenger (no real app's branding); the invoice list
// is Invoice Them itself.

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const CHAT_BG = '#E9EEEC';
const MINE = IOS.brand;

const Magnifier: React.FC<{
  size?: number;
  color?: string;
  weight?: number;
}> = ({ size = 22, color = IOS.tertiary, weight = 2.4 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={weight}
    strokeLinecap="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);
export { Magnifier };

const Bubble: React.FC<{
  mine?: boolean;
  at: number;
  f: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ mine, at, f, children, style }) => {
  const p = interpolate(f - at, [0, 14], [0, 1], { ...CLAMP, easing: SPRING });
  return (
    <div
      style={{
        alignSelf: mine ? 'flex-start' : 'flex-end', // RTL layout: the sender's side is the right
        maxWidth: 270,
        padding: '10px 15px',
        borderRadius: 22,
        borderBottomRightRadius: mine ? 6 : 22,
        borderBottomLeftRadius: mine ? 22 : 6,
        background: mine ? MINE : '#FFFFFF',
        color: mine ? '#FFFFFF' : IOS.label,
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.45,
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        opacity: interpolate(f - at, [0, 5], [0, 1], CLAMP),
        scale: interpolate(p, [0, 1], [0.7, 1]),
        transformOrigin: mine ? '0% 100%' : '100% 100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** S1: the job is delivered; the client says they will transfer the money. */
export const ChatScreen: React.FC<{
  f: number;
  typeAt: number;
  replyAt: number;
  readAt: number;
}> = ({ f, typeAt, replyAt, readAt }) => {
  const typing = f >= typeAt && f < replyAt;
  const dots = [0, 1, 2].map((i) => 0.35 + 0.65 * Math.max(0, Math.sin((f - i * 4) / 4)));
  return (
    <Screen bg={CHAT_BG}>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 118,
          background: 'rgba(255,255,255,0.94)',
          fontFamily: AR_FONT,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Avatar initials="ل" size={44} color={ACCENT.orange} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>لينا حداد</div>
            <div
              style={{
                fontSize: 13,
                color: typing ? IOS.brand : IOS.secondary,
                fontWeight: 600,
              }}
            >
              {typing ? 'يكتب الآن…' : 'متصلة'}
            </div>
          </div>
        </div>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 140,
          left: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontFamily: AR_FONT,
        }}
      >
        <Bubble mine at={6} f={f} style={{ padding: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 220,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="doc" size={26} color="#fff" weight={2} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>التسليم النهائي</div>
              <div
                dir="ltr"
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  fontFamily: FONT,
                  fontWeight: 500,
                  textAlign: 'right',
                }}
              >
                24 MB · ZIP
              </div>
            </div>
          </div>
        </Bubble>
        <Bubble mine at={26} f={f}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            خلصت الشغل
            <Icon name="checkCircle" size={22} color="#fff" weight={2.4} />
          </span>
        </Bubble>
        {typing ? (
          <div
            style={{
              alignSelf: 'flex-end',
              display: 'flex',
              gap: 6,
              padding: '14px 18px',
              borderRadius: 22,
              borderBottomRightRadius: 6,
              background: '#fff',
            }}
          >
            {dots.map((o, i) => (
              <div
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  background: IOS.tertiary,
                  opacity: o,
                }}
              />
            ))}
          </div>
        ) : null}
        <Bubble at={replyAt} f={f}>
          أبشر، الحين أحولك
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginTop: 2,
              opacity: interpolate(f - readAt, [0, 6], [0, 1], CLAMP),
            }}
          >
            <Icon name="check" size={16} color={ACCENT.blue} weight={3} />
            <Icon name="check" size={16} color={ACCENT.blue} weight={3} style={{ marginRight: -9 }} />
          </div>
        </Bubble>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: AR_FONT,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 46,
            borderRadius: 23,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            color: IOS.tertiary,
            fontSize: 17,
            fontWeight: 500,
          }}
        >
          اكتب رسالة
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: MINE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="paperplane" size={22} color="#fff" weight={2.2} style={{ scale: '-1 1' }} />
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

const THREADS = [
  ['سلطان', 'تمام الله يعطيك العافية'],
  ['عائلة الحداد', 'الصور وصلت؟'],
  ['ماجد المصمم', 'أرسلت لك الملفات'],
  ['أبو فهد', 'متى نتقابل؟'],
  ['شركة النخبة', 'تم استلام العرض'],
  ['لينا حداد', 'أبشر، الحين أحولك'],
  ['نورة', 'شكراً جزيلاً'],
  ['مؤسسة الندى', 'ممكن تعديل بسيط؟'],
  ['خالد', 'الله يسلمك'],
  ['فريق العمل', 'اجتماع بكرة الساعة ١٠'],
  ['عبدالله', 'وصلت الرسالة'],
  ['مطعم الديرة', 'نبي نعدل القائمة'],
];
const ROW_H = 76;

/** S2: the search for an invoice in a chat app. The search box fills in, and the chat list flies
 * past faster and faster. */
export const SearchScreen: React.FC<{
  f: number;
  typeStart: number;
  typeEnd: number;
}> = ({ f, typeStart, typeEnd }) => {
  const query = 'فاتورة لينا';
  const typed = Math.floor(clampInterp(f, [typeStart, typeEnd], [0, query.length], (t) => t));
  // Distance scrolled (pt): slow at first, then a blur.
  const dist = interpolate(f, [0, 108], [0, 2600], {
    ...CLAMP,
    easing: (t) => t * t,
  });
  const speed = interpolate(f, [0, 108], [0, 1], CLAMP);
  return (
    <Screen bg="#FFFFFF">
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 62,
          left: 14,
          right: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: AR_FONT,
          zIndex: 3,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 48,
            borderRadius: 16,
            background: IOS.fill,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            fontSize: 19,
            fontWeight: 600,
          }}
        >
          <Magnifier />
          <span>
            {query.slice(0, typed)}
            <span
              style={{
                opacity: Math.floor(f / 8) % 2 ? 0 : 1,
                color: IOS.brand,
              }}
            >
              |
            </span>
          </span>
        </div>
        <div style={{ fontSize: 18, color: ACCENT.blue, fontWeight: 700 }}>إلغاء</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 124,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          filter: `blur(${speed * 2.2}px)`,
        }}
      >
        <div dir="rtl" style={{ translate: `0px ${-dist}px`, fontFamily: AR_FONT }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const [name, preview] = THREADS[i % THREADS.length];
            return (
              <div
                key={i}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '0 16px',
                  borderBottom: `0.5px solid ${IOS.separator}`,
                }}
              >
                <Avatar initials={name[0]} size={50} color={[ACCENT.orange, ACCENT.violet, ACCENT.blue, ACCENT.pink, IOS.brand][i % 5]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
                  <div
                    style={{
                      fontSize: 15,
                      color: IOS.secondary,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {preview}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: IOS.tertiary,
                    fontFamily: FONT,
                  }}
                >
                  {((i * 7) % 12) + 1}:{String((i * 13) % 60).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

type Status = 'Paid' | 'Overdue' | 'Issued';
export const INVOICES: {
  client: string;
  initials: string;
  color: string;
  no: string;
  due: string;
  amount: number;
  status: Status;
}[] = [
  {
    client: 'Harbor Coffee Co.',
    initials: 'HC',
    color: ACCENT.orange,
    no: 'INV-0042',
    due: 'Oct 9',
    amount: 4290,
    status: 'Paid',
  },
  {
    client: 'Al Noor Trading',
    initials: 'AN',
    color: ACCENT.blue,
    no: 'INV-0041',
    due: 'Sep 28',
    amount: 1850,
    status: 'Overdue',
  },
  {
    client: 'Desert Design',
    initials: 'DD',
    color: ACCENT.violet,
    no: 'INV-0040',
    due: 'Sep 21',
    amount: 960,
    status: 'Paid',
  },
  {
    client: 'Sama Studio',
    initials: 'SS',
    color: ACCENT.pink,
    no: 'INV-0039',
    due: 'Oct 14',
    amount: 2400,
    status: 'Issued',
  },
  {
    client: 'Najd Logistics',
    initials: 'NL',
    color: IOS.brand,
    no: 'INV-0038',
    due: 'Sep 12',
    amount: 720,
    status: 'Paid',
  },
];
export const PAID_TOTAL = INVOICES.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
export const OWED_TOTAL = INVOICES.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

const PILL: Record<Status, { color: string; bg: string }> = {
  Paid: { color: '#1B8A55', bg: 'rgba(52,199,89,0.16)' },
  Overdue: { color: IOS.red, bg: 'rgba(255,59,48,0.14)' },
  Issued: { color: IOS.orange, bg: 'rgba(245,166,35,0.18)' },
};

const usd = (n: number) => '$' + n.toLocaleString('en-US');

/** S5: Invoice Them's document list. `paidAt` lights up the paid invoices, `owedAt` the rest. */
export const InvoiceList: React.FC<{
  f: number;
  paidAt: number;
  owedAt: number;
}> = ({ f, paidAt, owedAt }) => {
  const paidP = clampInterp(f, [paidAt, paidAt + 10], [0, 1]);
  const owedP = clampInterp(f, [owedAt, owedAt + 10], [0, 1]);
  return (
    <Screen>
      <div
        style={{
          position: 'absolute',
          top: 66,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em' }}>Invoices</div>
        <Circle icon="plus" tinted />
      </div>
      <div style={{ position: 'absolute', top: 140, left: 0, right: 0 }}>
        <div style={{ display: 'flex', gap: 12, margin: '0 16px 18px' }}>
          {[
            { label: 'Paid', value: PAID_TOTAL, color: '#1B8A55', p: paidP },
            {
              label: 'Outstanding',
              value: OWED_TOTAL,
              color: IOS.orange,
              p: owedP,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: IOS.card,
                borderRadius: 22,
                padding: '14px 16px',
                boxShadow: `0 0 0 ${2 * s.p}px ${s.color}`,
              }}
            >
              <div style={{ fontSize: 13, color: IOS.secondary, fontWeight: 500 }}>{s.label}</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: s.color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {usd(s.value)}
              </div>
            </div>
          ))}
        </div>
        <Section>
          {INVOICES.map((inv, i) => {
            const rise = interpolate(f - 4 - i * 4, [0, 14], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            const paid = inv.status === 'Paid';
            const dim = paid ? owedP * 0.5 : paidP * 0.5;
            const mark = paid ? paidP : owedP;
            const pill = PILL[inv.status];
            return (
              <div
                key={inv.no}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  height: 74,
                  padding: '0 16px',
                  opacity: rise * (1 - dim * (1 - mark)),
                  translate: `0px ${(1 - rise) * 30}px`,
                  background: `rgba(${paid ? '52,199,89' : inv.status === 'Overdue' ? '255,59,48' : '245,166,35'},${0.1 * mark})`,
                }}
              >
                <Avatar initials={inv.initials} size={44} color={inv.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inv.client}
                  </div>
                  <div style={{ fontSize: 13, color: IOS.secondary }}>
                    {inv.no} · Due {inv.due}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {usd(inv.amount)}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 3,
                      padding: '2px 10px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color: pill.color,
                      background: pill.bg,
                    }}
                  >
                    {inv.status}
                  </div>
                </div>
                {i < INVOICES.length - 1 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 72,
                      right: 0,
                      bottom: 0,
                      height: 0.5,
                      background: IOS.separator,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </Section>
      </div>
    </Screen>
  );
};
