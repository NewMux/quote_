import React from 'react';
import createQrCode from 'qrcode-generator';
import { interpolate } from 'remotion';
import { EASE_OUT, SPRING, clampInterp, money } from '../anim';
import { Burst, TapRipple } from '../components/Bits';
import { Icon, type IconName } from '../components/Icon';
import { SCREEN_H, SCREEN_W } from '../components/Phone';
import { Signature } from '../screens/Screens';
import { FONT } from '../theme';
import { ACCENT, IOS } from './theme';

// Light-mode mockups of the real app, in iOS points (393×852). Each takes `f`, the scene's local
// frame.

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Screen: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = IOS.grouped }) => (
  <div style={{ position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H, background: bg, fontFamily: FONT, color: IOS.label }}>
    {children}
  </div>
);

const Section: React.FC<{ header?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ header, children, style }) => (
  <div style={{ margin: '0 16px 18px', ...style }}>
    {header ? <div style={{ fontSize: 13, color: IOS.secondary, margin: '0 16px 7px', textTransform: 'uppercase' }}>{header}</div> : null}
    <div style={{ background: IOS.card, borderRadius: 26, overflow: 'hidden' }}>{children}</div>
  </div>
);

const Row: React.FC<{
  title: React.ReactNode;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  bold?: boolean;
  last?: boolean;
  left?: React.ReactNode;
  style?: React.CSSProperties;
  titleColor?: string;
}> = ({ title, subtitle, value, valueColor = IOS.secondary, bold, last, left, style, titleColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', minHeight: 52, padding: '8px 16px', gap: 12, position: 'relative', ...style }}>
    {left}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: bold ? 600 : 400, whiteSpace: 'nowrap', color: titleColor }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 13, color: IOS.secondary, marginTop: 1 }}>{subtitle}</div> : null}
    </div>
    {value ? <div style={{ fontSize: 17, color: valueColor, fontWeight: bold ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</div> : null}
    {last ? null : <div style={{ position: 'absolute', left: left ? 60 : 16, right: 0, bottom: 0, height: 0.5, background: IOS.separator }} />}
  </div>
);

const Circle: React.FC<{ icon: IconName; tinted?: boolean }> = ({ icon, tinted }) => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      background: tinted ? IOS.brand : 'rgba(255,255,255,0.92)',
      boxShadow: tinted ? 'none' : '0 1px 6px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon name={icon} size={20} weight={2.4} color={tinted ? '#fff' : IOS.label} />
  </div>
);

export const Avatar: React.FC<{ initials: string; size?: number; color?: string }> = ({ initials, size = 36, color = ACCENT.orange }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      color: '#fff',
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

const NavBar: React.FC<{ title: string; left?: IconName; right?: IconName }> = ({ title, left = 'xmark', right = 'check' }) => (
  <div style={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Circle icon={left} />
    <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
    <Circle icon={right} tinted />
  </div>
);

// ---------------------------------------------------------------------------------------------

export const ITEMS = [
  { name: 'Website redesign', qty: 1, rate: 2400 },
  { name: 'Brand photography', qty: 2, rate: 450 },
  { name: 'Monthly retainer', qty: 1, rate: 600 },
];

export const EditorLight: React.FC<{ f: number; adds: number[] }> = ({ f, adds }) => {
  const visible = ITEMS.map((_, i) => clampInterp(f, [adds[i], adds[i] + 12], [0, 1]));
  const subtotal = ITEMS.reduce((s, it, i) => s + it.qty * it.rate * clampInterp(f, [adds[i] + 6, adds[i] + 22], [0, 1]), 0);
  const tax = subtotal * 0.1;
  return (
    <Screen>
      <NavBar title="INV-0042" />
      <div style={{ paddingTop: 124 }}>
        <Section header="Client">
          <Row left={<Avatar initials="HC" />} title="Harbor Coffee Co." subtitle="lina@harborcoffee.co" last />
        </Section>
        <Section header="Items">
          {ITEMS.map((item, i) => {
            const typed = Math.floor(clampInterp(f, [adds[i], adds[i] + 18], [0, item.name.length], (t) => t));
            return (
              <div key={item.name} style={{ height: 62 * visible[i], overflow: 'hidden', opacity: visible[i] }}>
                <Row
                  title={item.name.slice(0, typed) + (typed < item.name.length ? '|' : '')}
                  subtitle={`${item.qty} × ${money(item.rate)}`}
                  value={money(item.qty * item.rate)}
                  valueColor={IOS.label}
                  style={{ height: 62 }}
                />
              </div>
            );
          })}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 16px', color: IOS.tint, fontSize: 17 }}>
            <Icon name="plus" size={20} weight={2.4} />
            Add Item
            {adds.map((a) => (
              <TapRipple key={a} at={a - 5} x={70} y={26} size={36} />
            ))}
          </div>
        </Section>
        <Section header="Totals">
          <Row title="Subtotal" value={money(subtotal)} />
          <Row title="VAT (10%)" value={money(tax)} />
          <Row title="Total" value={money(subtotal + tax)} valueColor={IOS.label} bold last />
        </Section>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

const CONTACT = { name: 'Lina Haddad', company: 'Harbor Coffee Co.', email: 'lina@harborcoffee.co', phone: '+973 3344 5566', address: '14 Harbor St, Manama' };

/** New Client form: "Fill from Contacts" at the top; fields fill in one by one from `fillAt`. */
export const NewClientLight: React.FC<{ f: number; tapAt: number; fillAt: number }> = ({ f, tapAt, fillAt }) => {
  const fields: [string, string][] = [
    ['Name', CONTACT.company],
    ['Contact', CONTACT.name],
    ['Email', CONTACT.email],
    ['Phone', CONTACT.phone],
    ['Address', CONTACT.address],
  ];
  return (
    <Screen>
      <NavBar title="New Client" />
      <div style={{ paddingTop: 124 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ opacity: clampInterp(f, [fillAt + 20, fillAt + 30], [0, 1]), position: 'absolute', marginTop: 0 }}>
            <Avatar initials="HC" size={84} />
          </div>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: IOS.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="people" size={40} color={IOS.tertiary} />
          </div>
        </div>
        <Section>
          <div style={{ position: 'relative' }}>
            <Row
              left={
                <div style={{ width: 30, height: 30, borderRadius: 8, background: ACCENT.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="people" size={18} color="#fff" weight={2.2} />
                </div>
              }
              title="Fill from Contacts"
              titleColor={IOS.tint}
              last
            />
            <TapRipple at={tapAt} x={120} y={26} size={40} />
          </div>
        </Section>
        <Section>
          {fields.map(([label, value], i) => {
            const shown = clampInterp(f, [fillAt + i * 5, fillAt + i * 5 + 8], [0, 1]);
            return (
              <div key={label} style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 16px' }}>
                <div style={{ width: 90, fontSize: 17, color: IOS.label }}>{label}</div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 17,
                    color: shown > 0.1 ? IOS.label : IOS.tertiary,
                    background: `rgba(255,122,47,${0.16 * interpolate(f - fillAt - i * 5, [0, 6, 26], [0, 1, 0], CLAMP)})`,
                    borderRadius: 6,
                    padding: '2px 4px',
                  }}
                >
                  {shown > 0.1 ? value : i === 0 ? 'Business or person' : 'Optional'}
                </div>
                {i < fields.length - 1 ? <div style={{ position: 'absolute', left: 16, right: 0, bottom: 0, height: 0.5, background: IOS.separator }} /> : null}
              </div>
            );
          })}
        </Section>
      </div>
    </Screen>
  );
};

/** The iOS contact picker sheet. `y` 0 = fully up, 1 = off screen. */
export const ContactsSheet: React.FC<{ y: number; f: number; tapAt: number }> = ({ y, f, tapAt }) => {
  const people = [
    ['AR', 'Aisha Rahman', ''],
    ['FK', 'Faisal Karim', ''],
    ['LH', 'Lina Haddad', 'Harbor Coffee Co.'],
    ['MA', 'Maryam Ali', ''],
    ['NB', 'Northwind Bakery', ''],
    ['OS', 'Omar Saleh', ''],
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 70, bottom: 0, translate: `0px ${y * 900}px`, zIndex: 8, color: IOS.label, fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: '38px 38px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: '#D1D1D6', margin: '8px auto 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px 6px' }}>
          <span style={{ fontSize: 17, color: IOS.tint }}>Cancel</span>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Contacts</span>
          <span style={{ width: 52 }} />
        </div>
        <div style={{ margin: '6px 16px 10px', height: 38, borderRadius: 12, background: IOS.fill, display: 'flex', alignItems: 'center', padding: '0 12px', color: IOS.tertiary, fontSize: 17 }}>
          Search
        </div>
        {people.map(([initials, name, sub], i) => (
          <div
            key={name}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              background: name === 'Lina Haddad' ? `rgba(0,0,0,${0.06 * interpolate(f - tapAt, [-2, 0, 10], [0, 1, 0], CLAMP)})` : 'transparent',
              borderBottom: `0.5px solid ${IOS.separator}`,
            }}
          >
            <Avatar initials={initials} size={40} color={['#8E8E93', '#A2845E', ACCENT.orange, '#5AC8FA', '#AF52DE', '#FF9F0A'][i]} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{name}</div>
              {sub ? <div style={{ fontSize: 13, color: IOS.secondary }}>{sub}</div> : null}
            </div>
            {name === 'Lina Haddad' ? <TapRipple at={tapAt} x={160} y={30} size={44} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------

export const SignLight: React.FC<{ f: number; drawStart: number; drawEnd: number; doneAt: number }> = ({ f, drawStart, drawEnd, doneAt }) => {
  const p = clampInterp(f, [drawStart, drawEnd], [0, 1], (t) => t);
  return (
    <Screen bg="#D9D9DE">
      <div style={{ position: 'absolute', top: 62, left: 0, right: 0, bottom: 0, background: IOS.grouped, borderRadius: '38px 38px 0 0' }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: '#C7C7CC', margin: '8px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <Circle icon="xmark" />
          <div style={{ fontSize: 17, fontWeight: 600 }}>Your Signature</div>
          <Circle icon="check" tinted />
        </div>
        <div style={{ margin: '18px 16px', background: '#FFFFFF', borderRadius: 24, height: 320, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ position: 'absolute', left: 26, right: 26, bottom: 64, height: 1.5, background: '#D1D1D6' }} />
          <div style={{ position: 'absolute', left: 26, bottom: 36, fontSize: 13, color: '#8E8E93' }}>Sign above the line</div>
          <div style={{ position: 'absolute', left: 20, top: 60 }}>
            <Signature progress={p} width={320} strokeWidth={3.8} />
          </div>
        </div>
        <div
          style={{
            margin: '10px auto 0',
            width: 190,
            height: 50,
            borderRadius: 25,
            background: 'rgba(52,199,89,0.14)',
            color: '#1B8A55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 17,
            fontWeight: 700,
            opacity: interpolate(f - doneAt, [0, 5], [0, 1], CLAMP),
            scale: interpolate(f - doneAt, [0, 14], [0.6, 1], { ...CLAMP, easing: SPRING }),
          }}
        >
          <Icon name="checkCircle" size={22} weight={2.4} color="#1B8A55" />
          Signed
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

function qrPath(text: string): { d: string; count: number } {
  const qr = createQrCode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { d, count };
}

export const QR: React.FC<{ text: string; size: number; color?: string }> = ({ text, size, color = '#111114' }) => {
  const { d, count } = qrPath(text);
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${count + 4} ${count + 4}`} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={count + 4} height={count + 4} fill="#fff" />
      <path d={d} fill={color} />
    </svg>
  );
};

export const PAY_LINK = 'https://paypal.me/northwind/4290.00';

/** The invoice PDF on white paper (640 px wide), with the new Pay Online block and large signatures. */
export const PdfV2: React.FC<{ signature?: number; payReveal?: number; accent?: string }> = ({ signature = 1, payReveal = 1, accent = '#1F2937' }) => {
  const ink = '#111827';
  const muted = '#6B7280';
  return (
    <div style={{ width: 640, height: 905, background: '#FFFFFF', borderRadius: 16, padding: '48px 46px', fontFamily: FONT, color: ink, position: 'relative', boxShadow: '0 40px 90px rgba(17,17,20,0.22)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `conic-gradient(from 210deg, ${ACCENT.violet}, ${ACCENT.blue}, ${ACCENT.pink}, ${ACCENT.violet})` }} />
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em' }}>Northwind Studio</div>
            <div style={{ fontSize: 12, color: muted }}>hello@northwind.studio</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: accent }}>Invoice</div>
          <div style={{ fontSize: 13, color: muted }}>INV-0042 · Due Oct 9</div>
        </div>
      </div>
      <div style={{ marginTop: 26, fontSize: 13 }}>
        <div style={{ color: muted, fontWeight: 700, fontSize: 10, letterSpacing: '0.08em' }}>BILL TO</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 3 }}>Harbor Coffee Co.</div>
      </div>
      <div style={{ marginTop: 18, fontSize: 13 }}>
        {ITEMS.map((item) => (
          <div key={item.name} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #F1F2F4' }}>
            <div style={{ flex: 1, fontWeight: 600 }}>{item.name}</div>
            <div style={{ width: 40, textAlign: 'right', color: muted }}>{item.qty}</div>
            <div style={{ width: 110, textAlign: 'right' }}>{money(item.qty * item.rate)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', width: 240, marginTop: 12, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: muted, padding: '3px 0' }}>
          <span>VAT (10%)</span>
          <span>$390.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: `2px solid ${ink}`, fontWeight: 800, fontSize: 19 }}>
          <span>Total</span>
          <span>$4,290.00</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: 16,
          borderRadius: 14,
          border: `1.5px solid ${ACCENT.pink}`,
          opacity: payReveal,
          scale: interpolate(payReveal, [0, 1], [0.92, 1]),
        }}
      >
        <QR text={PAY_LINK} size={104} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Pay online</div>
          <div style={{ fontSize: 12, color: muted, margin: '2px 0 10px' }}>Scan with your phone&apos;s camera, or tap.</div>
          <div style={{ display: 'inline-block', background: ACCENT.pink, color: '#fff', fontWeight: 700, fontSize: 14, padding: '8px 18px', borderRadius: 999 }}>Pay $4,290.00</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 46, right: 46, bottom: 44, display: 'flex', gap: 30 }}>
        {['Northwind Studio', 'Harbor Coffee Co.'].map((name, i) => (
          <div key={name} style={{ flex: 1 }}>
            <div style={{ height: 84, display: 'flex', alignItems: 'flex-end' }}>
              <Signature progress={i === 0 ? signature : Math.max(0, signature - 0.3) / 0.7} width={250} strokeWidth={4} />
            </div>
            <div style={{ borderTop: '1px solid #D1D5DB', paddingTop: 6, fontSize: 11, color: muted }}>
              <b style={{ color: ink }}>{name}</b> · Signed Sep 26
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------

/** The client's phone: camera finds the QR code, then a payment sheet opens. */
export const ScanPay: React.FC<{ f: number; detectAt: number; sheetAt: number; payAt: number }> = ({ f, detectAt, sheetAt, payAt }) => {
  const lock = clampInterp(f, [detectAt, detectAt + 10], [0, 1]);
  const sheet = clampInterp(f, [sheetAt, sheetAt + 16], [1, 0], SPRING);
  const paid = clampInterp(f, [payAt + 6, payAt + 12], [0, 1]);
  const box = interpolate(lock, [0, 1], [240, 200]);
  return (
    <Screen bg="#1A1A1C">
      {/* Camera view: a blurred paper with the QR code */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, #EDEDED 0%, #BDBDBD 45%, #2A2A2A 100%)' }} />
      <div style={{ position: 'absolute', left: (SCREEN_W - 150) / 2, top: 260, filter: `blur(${(1 - lock) * 2}px)` }}>
        <QR text={PAY_LINK} size={150} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: (SCREEN_W - box) / 2,
          top: 335 - box / 2,
          width: box,
          height: box,
          border: `4px solid ${lock > 0.5 ? ACCENT.yellow : 'rgba(255,255,255,0.8)'}`,
          borderRadius: 26,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 460,
          height: 44,
          borderRadius: 22,
          background: ACCENT.yellow,
          color: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 15,
          fontWeight: 700,
          opacity: lock,
          scale: interpolate(lock, [0, 1], [0.8, 1]),
        }}
      >
        paypal.me/northwind
        <TapRipple at={sheetAt - 6} x={136} y={22} size={36} />
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, border: '5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: '#fff' }} />
        </div>
      </div>
      {/* Payment sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 430, translate: `0px ${sheet * 470}px`, background: '#fff', borderRadius: '38px 38px 0 0', padding: '14px 22px', color: IOS.label }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: '#D1D1D6', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `conic-gradient(from 210deg, ${ACCENT.violet}, ${ACCENT.blue}, ${ACCENT.pink}, ${ACCENT.violet})` }} />
          <div>
            <div style={{ fontSize: 13, color: IOS.secondary }}>Pay</div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>Northwind Studio</div>
          </div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', margin: '22px 0 4px' }}>$4,290.00</div>
        <div style={{ fontSize: 14, color: IOS.secondary }}>Invoice INV-0042</div>
        <div
          style={{
            position: 'relative',
            marginTop: 30,
            height: 56,
            borderRadius: 16,
            background: paid > 0.5 ? '#1B8A55' : '#111114',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {paid > 0.5 ? <Icon name="check" size={22} color="#fff" weight={3} /> : null}
          {paid > 0.5 ? 'Paid' : 'Pay $4,290.00'}
          <TapRipple at={payAt} x={170} y={28} size={44} />
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

export const DetailLight: React.FC<{ f: number; paidAt: number }> = ({ f, paidAt }) => {
  const paid = clampInterp(f, [paidAt, paidAt + 4], [0, 1]);
  const balance = clampInterp(f, [paidAt, paidAt + 24], [4290, 0]);
  return (
    <Screen>
      <div style={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Circle icon="chevron" />
        <Circle icon="share" />
      </div>
      <div style={{ paddingTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar initials="HC" size={68} />
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>Harbor Coffee Co.</div>
        <div style={{ fontSize: 15, color: IOS.secondary }}>Invoice INV-0042</div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 16, fontVariantNumeric: 'tabular-nums' }}>{money(balance)}</div>
        <div style={{ fontSize: 13, color: IOS.secondary }}>Balance Due</div>
        <div style={{ position: 'relative', height: 38, width: 130, marginTop: 16 }}>
          {[
            { label: 'Issued', color: IOS.orange, bg: 'rgba(245,166,35,0.18)', icon: 'clock' as IconName, o: 1 - paid },
            { label: 'Paid', color: '#1B8A55', bg: 'rgba(52,199,89,0.16)', icon: 'checkCircle' as IconName, o: paid },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 19,
                background: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 15,
                fontWeight: 700,
                opacity: s.o,
                scale: s.label === 'Paid' ? interpolate(f - paidAt, [0, 12], [0.6, 1], { ...CLAMP, easing: SPRING }) : 1,
              }}
            >
              <Icon name={s.icon} size={18} weight={2.4} color={s.color} />
              {s.label}
            </div>
          ))}
          <Burst at={paidAt} x={65} y={19} count={24} spread={170} colors={[ACCENT.indigo, ACCENT.pink, ACCENT.orange, ACCENT.blue, ACCENT.yellow]} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, opacity: paid, translate: `0px ${(1 - paid) * 20}px` }}>
        <Section header="Payments">
          <Row title="Paid online" subtitle="Sep 26, 2026 · paypal.me" value="$4,290.00" valueColor="#1B8A55" last />
        </Section>
      </div>
    </Screen>
  );
};

export const riseStyle = (f: number, at: number, dy = 40) => ({
  opacity: interpolate(f - at, [0, 10], [0, 1], CLAMP),
  translate: `0px ${interpolate(f - at, [0, 18], [dy, 0], { ...CLAMP, easing: EASE_OUT })}px`,
});
