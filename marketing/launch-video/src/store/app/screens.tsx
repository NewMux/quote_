import React from 'react';
import { Icon } from '../../components/Icon';
import { Signature } from '../../screens/Screens';
import { FONT } from '../../theme';
import {
  AppButton,
  AVATAR_COLORS,
  Avatar,
  Chevron,
  GlassButton,
  Hairline,
  LIGHT,
  LargeTitleBar,
  STATUS,
  Screen,
  Section,
  Segmented,
  SymbolFill,
  TabBar,
  glass,
  useScreenSize,
  type StatusKey,
} from './ui';

// The app's screens, laid out from the real source: app/(tabs)/home, documents, clients,
// documents/[id] and modals/sign. The numbers are sample data for one small studio (Northwind).

const Glyph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LIGHT.label} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const FilterGlyph = () => (
  <Glyph>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M7.5 9h9M9.5 12.2h5M11 15.4h2" />
  </Glyph>
);
const EllipsisGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={LIGHT.label}>
    <circle cx="5.5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18.5" cy="12" r="2" />
  </svg>
);
const GlassSlot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...glass(), width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
);

const SearchField: React.FC<{ placeholder: string }> = ({ placeholder }) => (
  <div style={{ height: 36, borderRadius: 18, background: 'rgba(118,118,128,0.12)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: LIGHT.tertiary, fontSize: 17 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LIGHT.tertiary} strokeWidth="2.6" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
    {placeholder}
  </div>
);

const InlineStatus: React.FC<{ status: StatusKey }> = ({ status }) => {
  const s = STATUS[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.fg, fontSize: 13, fontWeight: 600 }}>
      <Icon name={s.icon} size={13} weight={2.4} color={s.fg} />
      {s.label}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// Summary

const Tile: React.FC<{ kind: 'check' | 'clock' | 'exclaim' | 'pencil'; color: string; label: string; amount: string; detail: string }> = ({ kind, color, label, amount, detail }) => (
  <div style={{ flex: 1, background: LIGHT.card, borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: LIGHT.secondary }}>
      <SymbolFill kind={kind} color={color} />
      {label}
    </div>
    <div>
      <div style={{ fontSize: 22, lineHeight: '28px', fontWeight: 700 }}>{amount}</div>
      <div style={{ fontSize: 13, lineHeight: '18px', color: LIGHT.secondary }}>{detail}</div>
    </div>
  </div>
);

const OVERDUE = [
  { client: 'Brightside Dental', number: 'INV-0036', due: 'Oct 3', amount: '$1,200.00' },
  { client: 'Orchard & Pine', number: 'INV-0038', due: 'Oct 10', amount: '$950.00' },
  { client: 'Lumen Fitness', number: 'INV-0039', due: 'Oct 12', amount: '$1,000.00' },
];

const PAID_BY_MONTH = [
  { label: 'May', value: 6200 },
  { label: 'Jun', value: 7450 },
  { label: 'Jul', value: 5900 },
  { label: 'Aug', value: 9100 },
  { label: 'Sep', value: 10300 },
  { label: 'Oct', value: 12840 },
];

/** The app's LineChart (src/components/charts/LineChart.tsx), same geometry. */
const LineChart: React.FC<{ data: { label: string; value: number }[]; height?: number }> = ({ data, height = 140 }) => {
  const size = useScreenSize();
  // The app's chart before PR #7 is a fixed 320 pt viewBox; after it, it draws at its container's width.
  const width = size.responsiveChart ? size.w - 2 * size.inset - 32 : 320;
  const px = 12;
  const py = 16;
  const cw = width - px * 2;
  const ch = height - py * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const pts = data.map((d, i) => ({ x: px + (i / (data.length - 1)) * cw, y: py + ch - ((d.value - min) / (max - min || 1)) * ch }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${py + ch} L ${pts[0].x} ${py + ch} Z`;
  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LIGHT.tint} stopOpacity={0.25} />
            <stop offset="1" stopColor={LIGHT.tint} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path d={line} stroke={LIGHT.tint} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={LIGHT.tint} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 12, color: LIGHT.secondary }}>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};

export const SummaryScreen: React.FC = () => {
  const { inset } = useScreenSize();
  return (
  <Screen>
    <LargeTitleBar title="Summary" buttons={['plus']} />
    <div style={{ position: 'absolute', top: 158, left: inset, right: inset }}>
      <Segmented values={['Month', '90 Days', 'Year', 'Custom']} selected={0} />
      <div style={{ padding: '24px 4px 20px' }}>
        <div style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: LIGHT.secondary }}>Outstanding</div>
        <div style={{ fontSize: 34, lineHeight: '41px', fontWeight: 700, letterSpacing: '-0.02em' }}>$8,940.00</div>
        <div style={{ fontSize: 15, lineHeight: '20px', color: LIGHT.secondary }}>6 invoices awaiting payment · October 2026</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Tile kind="check" color={LIGHT.green} label="Paid" amount="$12,840.00" detail="7 invoices" />
          <Tile kind="clock" color={LIGHT.orange} label="Unpaid" amount="$5,790.00" detail="3 invoices" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Tile kind="exclaim" color={LIGHT.red} label="Overdue" amount="$3,150.00" detail="3 invoices" />
          <Tile kind="pencil" color={LIGHT.gray} label="Drafts" amount="$1,780.00" detail="2 documents" />
        </div>
      </div>
      <Section header="Needs Attention" footer="Overdue invoices, oldest due date first.">
        {OVERDUE.map((o, i) => (
          <div key={o.number}>
            {i > 0 ? <Hairline inset={58} /> : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '10px 16px' }}>
              <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}>
                <SymbolFill kind="exclaim" color={LIGHT.red} size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, lineHeight: '22px' }}>{o.client}</div>
                <div style={{ fontSize: 15, lineHeight: '20px', color: LIGHT.secondary, marginTop: 2 }}>
                  {o.number} · Due {o.due}
                </div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: LIGHT.destructive }}>{o.amount}</div>
              <Chevron />
            </div>
          </div>
        ))}
      </Section>
      <Section header="Payments">
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, color: LIGHT.secondary }}>Paid This Month</div>
              <div style={{ fontSize: 28, lineHeight: '34px', fontWeight: 700 }}>$12,840.00</div>
            </div>
            <div style={{ fontSize: 13, color: LIGHT.secondary, marginBottom: 4 }}>Last 6 Months</div>
          </div>
          <LineChart data={PAID_BY_MONTH} />
        </div>
      </Section>
    </div>
    <TabBar active={0} />
  </Screen>
  );
};

// ---------------------------------------------------------------------------------------------
// Documents

type Doc = { client: string; number: string; date: string; total: string; status: StatusKey; estimate?: boolean };
export const DOCS: Doc[] = [
  { client: 'Harbor Coffee Co.', number: 'INV-0042', date: 'Oct 14', total: '$4,290.00', status: 'issued' },
  { client: 'Marlow & Finch', number: 'EST-0011', date: 'Oct 12', total: '$3,400.00', status: 'issued', estimate: true },
  { client: 'Juniper Bakery', number: 'INV-0041', date: 'Oct 9', total: '$780.00', status: 'paid' },
  { client: 'Saffron & Salt', number: 'INV-0040', date: 'Oct 6', total: '$2,150.00', status: 'partially_paid' },
  { client: 'Lumen Fitness', number: 'INV-0039', date: 'Sep 28', total: '$1,000.00', status: 'overdue' },
  { client: 'Orchard & Pine', number: 'INV-0038', date: 'Sep 26', total: '$950.00', status: 'overdue' },
  { client: 'Tidewater Studio', number: 'INV-0037', date: 'Sep 22', total: '$1,640.00', status: 'paid' },
  { client: 'Brightside Dental', number: 'INV-0036', date: 'Sep 18', total: '$1,200.00', status: 'overdue' },
  { client: 'Atlas Print Co.', number: 'INV-0035', date: 'Sep 11', total: '$2,880.00', status: 'paid' },
];

export const DocumentsScreen: React.FC = () => {
  const { inset } = useScreenSize();
  return (
  <Screen>
    <LargeTitleBar title="Documents" buttons={[]} />
    <div style={{ position: 'absolute', top: 58, right: 16, display: 'flex', gap: 10, zIndex: 5 }}>
      <GlassSlot>
        <Icon name="plus" size={19} weight={2.3} color={LIGHT.label} />
      </GlassSlot>
      <GlassSlot>
        <FilterGlyph />
      </GlassSlot>
    </div>
    <div style={{ position: 'absolute', top: 157, left: inset, right: inset }}>
      <SearchField placeholder="Search Documents" />
      <div style={{ height: 12 }} />
      <Segmented values={['All', 'Estimates', 'Invoices']} selected={0} />
      <div style={{ height: 16 }} />
      <div style={{ background: LIGHT.card, borderRadius: 26, overflow: 'hidden' }}>
        {DOCS.map((d, i) => (
          <div key={d.number}>
            {i > 0 ? <Hairline inset={64} /> : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: LIGHT.secondaryFill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="doc" size={18} weight={2.2} color={LIGHT.tint} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 17, lineHeight: '22px', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.client}</div>
                  <div style={{ fontSize: 17, lineHeight: '22px' }}>{d.total}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 15, lineHeight: '20px', color: LIGHT.secondary }}>
                    {d.number} · {d.date}
                  </div>
                  <InlineStatus status={d.status} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <TabBar active={1} />
  </Screen>
  );
};

// ---------------------------------------------------------------------------------------------
// Document detail (an issued invoice)

export const DetailScreen: React.FC = () => {
  const s = STATUS.issued;
  const stages = ['Draft', 'Issued', 'Paid'];
  return (
    <Screen>
      <div style={{ position: 'absolute', top: 58, left: 16, zIndex: 5 }}>
        <GlassSlot>
          <div style={{ rotate: '180deg', display: 'flex' }}>
            <Icon name="chevron" size={18} weight={2.6} color={LIGHT.label} />
          </div>
        </GlassSlot>
      </div>
      <div style={{ position: 'absolute', top: 58, right: 16, display: 'flex', gap: 10, zIndex: 5 }}>
        <GlassSlot>
          <Icon name="pencil" size={18} weight={2.3} color={LIGHT.label} />
        </GlassSlot>
        <GlassSlot>
          <EllipsisGlyph />
        </GlassSlot>
      </div>
      <div style={{ position: 'absolute', top: 110, left: 16, right: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar name="Harbor Coffee Co." color={AVATAR_COLORS[1]} size={64} />
        <div style={{ fontSize: 20, lineHeight: '25px', fontWeight: 600, marginTop: 8 }}>Harbor Coffee Co.</div>
        <div style={{ fontSize: 15, lineHeight: '20px', color: LIGHT.secondary }}>Invoice INV-0042</div>
        <div style={{ fontSize: 34, lineHeight: '41px', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 12 }}>$4,290.00</div>
        <div style={{ fontSize: 13, color: LIGHT.secondary }}>Balance Due</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 12px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 15, fontWeight: 600 }}>
          <Icon name={s.icon} size={14} weight={2.4} color={s.fg} />
          {s.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, fontSize: 15 }}>
          {stages.map((st, i) => (
            <div key={st} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: i <= 1 ? LIGHT.tint : LIGHT.secondary, fontWeight: i <= 1 ? 600 : 400 }}>{st}</span>
              {i < stages.length - 1 ? (
                <span style={{ margin: '0 4px', display: 'flex' }}>
                  <Icon name="chevron" size={11} weight={2.8} color={i < 1 ? LIGHT.tint : LIGHT.chevron} />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ alignSelf: 'stretch', marginTop: 20 }}>
          <AppButton label="Log Payment" variant="filled" large />
          <div style={{ fontSize: 13, lineHeight: '18px', color: LIGHT.secondary, textAlign: 'center', marginTop: 8 }}>Record a payment you received for this invoice.</div>
        </div>
        <div style={{ alignSelf: 'stretch', marginTop: 12 }}>
          <AppButton label="Share PDF" variant="tinted" icon="share" />
        </div>
        <div style={{ alignSelf: 'stretch', marginTop: 28 }}>
          <Section>
            {[
              ['Client', 'Harbor Coffee Co.', true],
              ['Issued', 'Oct 14, 2026', false],
              ['Payment Due', 'Oct 28, 2026', false],
            ].map(([k, v, chev], i) => (
              <div key={k as string}>
                {i > 0 ? <Hairline inset={16} /> : null}
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '10px 16px', gap: 12 }}>
                  <div style={{ flex: 1, fontSize: 17 }}>{k}</div>
                  <div style={{ fontSize: 17, color: LIGHT.secondary }}>{v}</div>
                  {chev ? <Chevron /> : null}
                </div>
              </div>
            ))}
          </Section>
        </div>
      </div>
      <TabBar active={1} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------
// Signature sheet (app/modals/sign.tsx)

/** The sheet alone, 393 × 790 pt, for crops that don't need the screen behind it. */
export const SignSheet: React.FC = () => (
  <div style={{ position: 'relative', width: 393, height: 790, background: LIGHT.grouped, borderRadius: '38px 38px 0 0', fontFamily: FONT, color: LIGHT.label, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 6px', minHeight: 64 }}>
      <div style={{ flex: 1, display: 'flex' }}>
        <GlassButton icon="xmark" />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Your Signature</div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <GlassButton icon="check" prominent />
      </div>
    </div>
    <div style={{ position: 'absolute', left: 16, right: 16, top: 84, bottom: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ flex: 1, background: '#fff', border: `1px solid ${LIGHT.field}`, borderRadius: 26, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 14, top: 140 }}>
          <Signature progress={1} width={340} strokeWidth={3.6} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <div style={{ fontSize: 15, color: LIGHT.secondary }}>Sign above with your finger.</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: LIGHT.tint, padding: '10px 16px' }}>Clear</div>
      </div>
    </div>
  </div>
);

export const SignScreen: React.FC = () => (
  <Screen bg="#6B6B70">
    {/* The screen underneath, pushed back by the sheet. */}
    <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.94)', transformOrigin: '50% 0', borderRadius: 40, overflow: 'hidden', filter: 'brightness(0.62)' }}>
      <DetailScreen />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 62, boxShadow: '0 -10px 40px rgba(0,0,0,0.25)', borderRadius: '38px 38px 0 0' }}>
      <SignSheet />
    </div>
  </Screen>
);

// ---------------------------------------------------------------------------------------------
// Clients

const CLIENTS: { letter: string; people: { name: string; detail: string }[] }[] = [
  { letter: 'A', people: [{ name: 'Atlas Print Co.', detail: 'billing@atlasprint.co' }] },
  {
    letter: 'B',
    people: [
      { name: 'Birchwood Cabinets', detail: '+1 (555) 013-2218' },
      { name: 'Brightside Dental', detail: 'office@brightsidedental.com' },
    ],
  },
  { letter: 'H', people: [{ name: 'Harbor Coffee Co.', detail: 'lina@harborcoffee.co' }] },
  { letter: 'J', people: [{ name: 'Juniper Bakery', detail: 'hello@juniperbakery.com' }] },
  { letter: 'L', people: [{ name: 'Lumen Fitness', detail: 'team@lumenfit.com' }] },
  { letter: 'M', people: [{ name: 'Marlow & Finch', detail: 'accounts@marlowfinch.com' }] },
];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);

export const ClientsScreen: React.FC = () => {
  const { inset } = useScreenSize();
  return (
  <Screen>
    <LargeTitleBar title="Clients" buttons={[]} />
    <div style={{ position: 'absolute', top: 58, right: 16, display: 'flex', gap: 10, zIndex: 5 }}>
      <GlassSlot>
        <Icon name="plus" size={19} weight={2.3} color={LIGHT.label} />
      </GlassSlot>
      <GlassSlot>
        <FilterGlyph />
      </GlassSlot>
    </div>
    <div style={{ position: 'absolute', top: 157, left: inset, right: inset }}>
      <SearchField placeholder="Search Clients" />
      {CLIENTS.map((section) => (
        <div key={section.letter}>
          <div style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: LIGHT.secondary, padding: '16px 16px 8px' }}>{section.letter}</div>
          <div style={{ background: LIGHT.card, borderRadius: 26, overflow: 'hidden' }}>
            {section.people.map((p, i) => (
              <div key={p.name}>
                {i > 0 ? <Hairline inset={64} /> : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', minHeight: 56 }}>
                  <Avatar name={p.name} color={AVATAR_COLORS[hash(p.name) % AVATAR_COLORS.length]} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, lineHeight: '22px' }}>{p.name}</div>
                    <div style={{ fontSize: 15, lineHeight: '20px', color: LIGHT.secondary }}>{p.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <TabBar active={2} />
  </Screen>
  );
};
