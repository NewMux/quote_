import React from 'react';
import { interpolate } from 'remotion';
import { EASE_OUT, SPRING, clampInterp, money } from '../anim';
import { Burst, TabBar, TapRipple } from '../components/Bits';
import { Icon, type IconName } from '../components/Icon';
import { SCREEN_H, SCREEN_W } from '../components/Phone';
import { C, FONT } from '../theme';

// Mockups of the real app's redesigned screens, in iOS points. Each takes `f`, the scene's local
// frame, and animates its own content.

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const pop = (f: number, at: number) => ({
  opacity: interpolate(f - at, [0, 5], [0, 1], CLAMP),
  scale: interpolate(f - at, [0, 14], [0.6, 1], { ...CLAMP, easing: SPRING }),
});

const rise = (f: number, at: number, dy = 16) => ({
  opacity: interpolate(f - at, [0, 6], [0, 1], CLAMP),
  translate: `0px ${interpolate(f - at, [0, 12], [dy, 0], { ...CLAMP, easing: EASE_OUT })}px`,
});

const Screen: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = C.bg }) => (
  <div style={{ position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H, background: bg, fontFamily: FONT, color: C.label }}>
    {children}
  </div>
);

const Section: React.FC<{ header?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ header, children, style }) => (
  <div style={{ margin: '0 16px 18px', ...style }}>
    {header ? (
      <div style={{ fontSize: 13, color: C.secondary, margin: '0 16px 7px', textTransform: 'uppercase', letterSpacing: '0.01em' }}>{header}</div>
    ) : null}
    <div style={{ background: C.card, borderRadius: 26, overflow: 'hidden' }}>{children}</div>
  </div>
);

const Row: React.FC<{ title: string; subtitle?: string; value?: string; valueColor?: string; bold?: boolean; last?: boolean; left?: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  subtitle,
  value,
  valueColor = C.secondary,
  bold,
  last,
  left,
  style,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', minHeight: 52, padding: '8px 16px', gap: 12, position: 'relative', ...style }}>
    {left}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: bold ? 600 : 400, whiteSpace: 'nowrap' }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 13, color: C.secondary, marginTop: 1 }}>{subtitle}</div> : null}
    </div>
    {value ? <div style={{ fontSize: 17, color: valueColor, fontWeight: bold ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</div> : null}
    {last ? null : <div style={{ position: 'absolute', left: left ? 60 : 16, right: 0, bottom: 0, height: 0.5, background: C.separator }} />}
  </div>
);

const GlassCircle: React.FC<{ icon: IconName; tinted?: boolean }> = ({ icon, tinted }) => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      background: tinted ? C.brand : 'rgba(58,58,60,0.8)',
      border: '0.5px solid rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon name={icon} size={20} weight={2.4} color="#fff" />
  </div>
);

const Avatar: React.FC<{ initials: string; size?: number }> = ({ initials, size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `linear-gradient(145deg, #2FB58C, ${C.brand})`,
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

// ---------------------------------------------------------------------------------------------

export const SummaryScreen: React.FC<{ f: number }> = ({ f }) => {
  const outstanding = clampInterp(f, [6, 46], [0, 12480]);
  const tiles: [IconName, string, string, string][] = [
    ['checkCircle', C.green, '$38,200', 'Paid'],
    ['clock', C.orange, '$12,480', 'Unpaid'],
    ['exclaim', C.red, '$2,150', 'Overdue'],
    ['pencil', C.gray, '3', 'Drafts'],
  ];
  const bars = [0.42, 0.55, 0.48, 0.7, 0.62, 0.92];
  return (
    <Screen>
      <div style={{ position: 'absolute', top: 58, right: 16 }}>
        <GlassCircle icon="plus" />
      </div>
      <div style={{ paddingTop: 104 }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 20px 14px' }}>Summary</div>
        <div style={{ margin: '0 20px 18px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.secondary }}>Outstanding</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{money(outstanding)}</div>
          <div style={{ fontSize: 13, color: C.secondary }}>across 7 unpaid invoices</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 20px' }}>
          {tiles.map(([icon, color, value, label], i) => (
            <div key={label} style={{ background: C.card, borderRadius: 22, padding: 14, ...pop(f, 16 + i * 4) }}>
              <Icon name={icon} size={26} color={color} weight={2.2} />
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: '-0.01em' }}>{value}</div>
              <div style={{ fontSize: 13, color: C.secondary }}>{label}</div>
            </div>
          ))}
        </div>
        <Section header="Needs Attention" style={rise(f, 34)}>
          <Row left={<Avatar initials="NB" />} title="Northwind Bakery" subtitle="INV-0038 · 12 days overdue" value="$1,450.00" valueColor={C.red} />
          <Row left={<Avatar initials="LH" />} title="Lina Haddad Design" subtitle="INV-0035 · 5 days overdue" value="$700.00" valueColor={C.red} last />
        </Section>
        <Section header="Paid by Month" style={rise(f, 42)}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 150, padding: '18px 22px 12px' }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    borderRadius: 7,
                    height: `${h * 100 * clampInterp(f, [46 + i * 3, 66 + i * 3], [0, 1], SPRING)}%`,
                    background: i === bars.length - 1 ? `linear-gradient(180deg, ${C.mint}, ${C.tint})` : 'rgba(76,211,165,0.45)',
                  }}
                />
                <div style={{ fontSize: 11, color: C.secondary }}>{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i]}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <TabBar active={0} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

const ITEMS = [
  { name: 'Website redesign', qty: 1, rate: 2400 },
  { name: 'Brand photography', qty: 2, rate: 450 },
  { name: 'Monthly retainer', qty: 1, rate: 600 },
];

/** `adds` are the frames the three items are added (the Add Item tap happens 4 frames earlier). */
export const EditorScreen: React.FC<{ f: number; adds: number[] }> = ({ f, adds }) => {
  const visible = ITEMS.map((_, i) => clampInterp(f, [adds[i], adds[i] + 10], [0, 1]));
  const subtotal = ITEMS.reduce((sum, item, i) => sum + item.qty * item.rate * clampInterp(f, [adds[i] + 4, adds[i] + 16], [0, 1]), 0);
  const tax = subtotal * 0.1;
  return (
    <Screen>
      <div style={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <GlassCircle icon="xmark" />
        <div style={{ fontSize: 17, fontWeight: 600 }}>INV-0042</div>
        <GlassCircle icon="check" tinted />
      </div>
      <div style={{ paddingTop: 124 }}>
        <Section header="Client">
          <Row left={<Avatar initials="HC" />} title="Harbor Coffee Co." subtitle="hello@harborcoffee.co" last />
        </Section>
        <Section header="Items">
          {ITEMS.map((item, i) => {
            const typed = Math.floor(clampInterp(f, [adds[i], adds[i] + 12], [0, item.name.length], (t) => t));
            return (
              <div key={item.name} style={{ height: 62 * visible[i], overflow: 'hidden', opacity: visible[i] }}>
                <Row
                  title={item.name.slice(0, typed) + (typed < item.name.length ? '|' : '')}
                  subtitle={`${item.qty} × ${money(item.rate)}`}
                  value={money(item.qty * item.rate)}
                  valueColor={C.label}
                  style={{ height: 62 }}
                />
              </div>
            );
          })}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 16px', color: C.tint, fontSize: 17 }}>
            <Icon name="plus" size={20} weight={2.4} />
            Add Item
            {adds.map((a) => (
              <TapRipple key={a} at={a - 4} x={70} y={26} size={36} />
            ))}
          </div>
        </Section>
        <Section header="Totals">
          <Row title="Subtotal" value={money(subtotal)} />
          <Row title="VAT (10%)" value={money(tax)} />
          <Row
            title="Total"
            value={money(subtotal + tax)}
            valueColor={C.tint}
            bold
            last
            style={{
              background: `rgba(76,211,165,${0.16 * clampInterp(f, [adds[2] + 16, adds[2] + 22, adds[2] + 40], [0, 1, 0.4])})`,
            }}
          />
        </Section>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

/** A flowing hand signature: one path, drawn with stroke-dashoffset. viewBox 0 0 300 120. */
export const SIGNATURE_PATHS = [
  'M18 84 C28 44 44 18 55 32 C66 48 38 96 50 96 C62 96 70 56 81 56 C92 56 82 86 93 86 C104 86 109 52 119 53 C130 54 119 87 131 87 C144 87 150 44 161 47 C172 50 160 89 176 86 C191 83 197 57 207 59 C218 61 210 85 223 83 C241 80 252 60 284 48',
  'M36 104 C100 95 182 99 272 90',
];

export const Signature: React.FC<{ progress: number; color?: string; width?: number; strokeWidth?: number }> = ({
  progress,
  color = '#0B1F3A',
  width = 300,
  strokeWidth = 3.4,
}) => (
  <svg width={width} height={(width * 120) / 300} viewBox="0 0 300 120" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={SIGNATURE_PATHS[0]} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, progress / 0.82)} strokeOpacity={progress > 0.005 ? 1 : 0} />
    <path d={SIGNATURE_PATHS[1]} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, (progress - 0.82) / 0.18)} strokeOpacity={progress > 0.825 ? 1 : 0} />
  </svg>
);

export const SignScreen: React.FC<{ f: number; drawStart: number; drawEnd: number; doneAt: number }> = ({ f, drawStart, drawEnd, doneAt }) => {
  const p = clampInterp(f, [drawStart, drawEnd], [0, 1], (t) => t);
  return (
    <Screen bg="#0A0A0B">
      <div style={{ position: 'absolute', top: 62, left: 0, right: 0, bottom: 0, background: '#1C1C1E', borderRadius: '38px 38px 0 0' }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.3)', margin: '8px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <GlassCircle icon="xmark" />
          <div style={{ fontSize: 17, fontWeight: 600 }}>Your Signature</div>
          <GlassCircle icon="check" tinted />
        </div>
        <div style={{ margin: '18px 16px', background: '#FFFFFF', borderRadius: 24, height: 300, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 30, right: 30, bottom: 70, height: 1.5, background: '#D1D1D6' }} />
          <div style={{ position: 'absolute', left: 30, bottom: 40, fontSize: 13, color: '#8E8E93' }}>Sign above the line</div>
          <div style={{ position: 'absolute', left: 30, top: 70 }}>
            <Signature progress={p} width={300} />
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: C.secondary, margin: '0 30px' }}>Signed by Northwind Studio · Sep 25, 2026</div>
        <div
          style={{
            margin: '26px auto 0',
            width: 190,
            height: 50,
            borderRadius: 25,
            background: 'rgba(95,216,151,0.16)',
            color: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 17,
            fontWeight: 700,
            ...pop(f, doneAt),
          }}
        >
          <Icon name="checkCircle" size={22} weight={2.4} color={C.green} />
          Signed
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

export const DetailScreen: React.FC<{ f: number; tapAt: number; paidAt: number }> = ({ f, tapAt, paidAt }) => {
  const paid = clampInterp(f, [paidAt, paidAt + 4], [0, 1]);
  const balance = clampInterp(f, [paidAt, paidAt + 18], [4290, 0]);
  const stage = ['Draft', 'Issued', 'Paid'];
  return (
    <Screen>
      <div style={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
        <GlassCircle icon="chevron" />
        <GlassCircle icon="share" />
      </div>
      <div style={{ paddingTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar initials="HC" size={68} />
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>Harbor Coffee Co.</div>
        <div style={{ fontSize: 15, color: C.secondary }}>Invoice INV-0042</div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 16, fontVariantNumeric: 'tabular-nums' }}>{money(balance)}</div>
        <div style={{ fontSize: 13, color: C.secondary }}>Balance Due</div>
        <div style={{ position: 'relative', height: 38, width: 130, marginTop: 16 }}>
          {[
            { label: 'Issued', color: C.orange, icon: 'clock' as IconName, o: 1 - paid },
            { label: 'Paid', color: C.green, icon: 'checkCircle' as IconName, o: paid },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 19,
                background: `${s.color}2A`,
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
          <Burst at={paidAt} x={65} y={19} count={26} spread={170} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {stage.map((s, i) => {
            const done = i < 2 || paid > 0.5;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: done ? C.tint : C.tertiary, fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: done ? C.tint : C.fill }} />
                  {s}
                </div>
                {i < 2 ? <div style={{ width: 22, height: 1.5, background: done ? C.tint : C.fill }} /> : null}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: 26,
            width: 361,
            height: 52,
            borderRadius: 26,
            background: paid > 0.5 ? 'rgba(76,211,165,0.16)' : C.brand,
            color: paid > 0.5 ? C.tint : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 17,
            fontWeight: 600,
            scale: interpolate(f - tapAt, [0, 3, 8], [1, 0.95, 1], CLAMP),
          }}
        >
          {paid > 0.5 ? <Icon name="share" size={20} weight={2.2} color={C.tint} /> : null}
          {paid > 0.5 ? 'Share Receipt' : 'Log Payment'}
          <TapRipple at={tapAt} x={180} y={26} size={40} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 0, right: 0 }}>
        <Section header="Payments" style={{ opacity: paid }}>
          <Row title="Bank Transfer" subtitle="Sep 25, 2026" value="$4,290.00" valueColor={C.green} last />
        </Section>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------

/** The generated PDF, as printed on white paper (in video pixels, 640 wide). */
export const PdfPaper: React.FC<{ signature?: number }> = ({ signature = 1 }) => {
  const ink = '#111827';
  const muted = '#6B7280';
  return (
    <div style={{ width: 640, height: 905, background: '#FFFFFF', borderRadius: 14, padding: '52px 50px', fontFamily: FONT, color: ink, position: 'relative', boxShadow: '0 50px 100px rgba(0,0,0,0.55)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: `conic-gradient(from 200deg, ${C.brand}, #2FB58C, ${C.brandDark}, ${C.brand})` }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Northwind Studio</div>
            <div style={{ fontSize: 13, color: muted }}>hello@northwind.studio</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: C.brand, letterSpacing: '0.04em' }}>INVOICE</div>
          <div style={{ fontSize: 14, color: muted }}>INV-0042 · Sep 25, 2026</div>
        </div>
      </div>
      <div style={{ height: 3, background: C.brand, borderRadius: 2, margin: '28px 0 22px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <div>
          <div style={{ color: muted, fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>BILL TO</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>Harbor Coffee Co.</div>
          <div style={{ color: muted }}>14 Harbor Street</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: muted, fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}>DUE</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>Oct 9, 2026</div>
        </div>
      </div>
      <div style={{ marginTop: 30, fontSize: 14 }}>
        <div style={{ display: 'flex', color: muted, fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', paddingBottom: 8, borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ flex: 1 }}>DESCRIPTION</div>
          <div style={{ width: 60, textAlign: 'right' }}>QTY</div>
          <div style={{ width: 120, textAlign: 'right' }}>AMOUNT</div>
        </div>
        {ITEMS.map((item) => (
          <div key={item.name} style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ flex: 1, fontWeight: 600 }}>{item.name}</div>
            <div style={{ width: 60, textAlign: 'right', color: muted }}>{item.qty}</div>
            <div style={{ width: 120, textAlign: 'right' }}>{money(item.qty * item.rate)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', width: 260, marginTop: 20, fontSize: 14 }}>
        {[
          ['Subtotal', '$3,900.00'],
          ['VAT (10%)', '$390.00'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: muted }}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 6, borderTop: `2px solid ${C.brand}`, fontWeight: 800, fontSize: 20 }}>
          <span>Total</span>
          <span style={{ color: C.brand }}>$4,290.00</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 50, bottom: 74 }}>
        <Signature progress={signature} width={220} strokeWidth={3.6} />
        <div style={{ width: 230, height: 1, background: '#D1D5DB' }} />
        <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>Authorized signature</div>
      </div>
      <div style={{ position: 'absolute', right: 50, bottom: 50, fontSize: 12, color: muted }}>Thank you for your business.</div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------

export const ShareSheet: React.FC<{ f: number; tapAt: number }> = ({ f, tapAt }) => {
  const apps: [IconName, string, string][] = [
    ['mail', 'Mail', 'linear-gradient(180deg, #5AB2FF, #1A73E8)'],
    ['message', 'Messages', 'linear-gradient(180deg, #6EE07A, #2DBE4B)'],
    ['folder', 'Files', 'linear-gradient(180deg, #7CC4FF, #2F8CF0)'],
    ['doc', 'Notes', 'linear-gradient(180deg, #FFE27A, #F5C518)'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        height: 430,
        borderRadius: 40,
        background: 'rgba(44,44,48,0.86)',
        border: '0.5px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        padding: 18,
        fontFamily: FONT,
        color: C.label,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 54, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 26, height: 3, background: C.brand, borderRadius: 2 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>INV-0042.pdf</div>
          <div style={{ fontSize: 13, color: C.secondary }}>PDF Document · 84 KB</div>
        </div>
        <GlassCircle icon="xmark" />
      </div>
      <div style={{ height: 0.5, background: C.separator, margin: '16px -18px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {apps.map(([icon, label, bg], i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', ...pop(f, 6 + i * 3) }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={32} weight={2} color="#fff" />
            </div>
            <div style={{ fontSize: 12 }}>{label}</div>
            {i === 0 ? <TapRipple at={tapAt} x={31} y={31} size={40} /> : null}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.07)', borderRadius: 18 }}>
        {[
          ['Save to Files', 'folder'],
          ['Print', 'doc'],
          ['Copy', 'share'],
        ].map(([label, icon], i) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i ? `0.5px solid ${C.separator}` : 'none', fontSize: 17 }}>
            {label}
            <Icon name={icon as IconName} size={20} color={C.label} />
          </div>
        ))}
      </div>
    </div>
  );
};
