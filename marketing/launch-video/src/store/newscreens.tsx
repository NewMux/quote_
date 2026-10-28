import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND_FONT } from '../brand';
import { Icon, type IconName } from '../components/Icon';
import { Phone } from '../components/Phone';
import { FONT } from '../theme';
import { QR } from '../v2/screens';
import { PAL } from './design';
import { AVATAR_COLORS, AppButton, Avatar, Hairline, LIGHT, STATUS, Screen, Section, SymbolFill, glass, type StatusKey } from './app/ui';

// Mockups of the screens in PR #8 (welcome tour, paywall "How It Works"), drawn from the code's own
// text, sizes and colors in iOS points (393 × 852). Not a device capture.

// ---------------------------------------------------------------------------------------------
// Welcome tour (app/welcome.tsx)

const MockCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 340, background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 8px 18px rgba(0,0,0,0.08)' }}>{children}</div>
);
const Bar: React.FC<{ w: string }> = ({ w }) => <div style={{ height: 8, width: w, borderRadius: 4, background: '#E9E9EE', marginBottom: 8 }} />;

const SummaryArt = () => (
  <MockCard>
    <div style={{ fontSize: 13, fontWeight: 600, color: LIGHT.secondary, marginBottom: 4 }}>Summary</div>
    {[
      { t: 'Outstanding', v: '$4,280', k: 'clock' as const, c: LIGHT.orange },
      { t: 'Paid This Month', v: '$9,615', k: 'check' as const, c: LIGHT.green },
      { t: 'Overdue', v: '$740', k: 'exclaim' as const, c: LIGHT.red },
    ].map((r, i) => (
      <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? `1px solid ${LIGHT.separator}` : 'none' }}>
        <SymbolFill kind={r.k} color={r.c} size={22} />
        <div style={{ flex: 1, fontSize: 15, color: LIGHT.secondary }}>{r.t}</div>
        <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.v}</div>
      </div>
    ))}
  </MockCard>
);

const EstimateArt = () => (
  <MockCard>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Estimate EST-0042</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: LIGHT.green, fontSize: 13, fontWeight: 600 }}>
        <SymbolFill kind="check" color={LIGHT.green} size={15} />
        Signed
      </div>
    </div>
    <Bar w="85%" />
    <Bar w="65%" />
    <Bar w="75%" />
    <div style={{ marginTop: 8, borderRadius: 16, border: `1px dashed ${LIGHT.field}`, padding: 12 }}>
      <div style={{ fontSize: 22, lineHeight: '28px', fontStyle: 'italic', fontWeight: 300 }}>J. Carter</div>
      <div style={{ height: 1, background: LIGHT.separator, margin: '4px 0' }} />
      <div style={{ fontSize: 12, color: LIGHT.secondary }}>Client signature</div>
    </div>
    <div style={{ marginTop: 16, borderRadius: 999, background: LIGHT.brand, padding: '10px 0', textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: 600 }}>Convert to Invoice</div>
  </MockCard>
);

const PdfArt = () => (
  <MockCard>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: LIGHT.brand, color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SP</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Sam&apos;s Plumbing</div>
        <div style={{ fontSize: 12, color: LIGHT.secondary }}>Invoice INV-0108</div>
      </div>
    </div>
    <Bar w="70%" />
    <Bar w="55%" />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${LIGHT.separator}`, paddingTop: 12, marginTop: 8, marginBottom: 16 }}>
      <div style={{ fontSize: 15, color: LIGHT.secondary }}>Total Due</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>$1,250.00</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, borderRadius: 999, background: LIGHT.brand, padding: '10px 0', textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: 600 }}>Pay Now</div>
      <div style={{ borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
        <QR text="https://example.com/pay/INV-0108" size={64} />
      </div>
    </div>
  </MockCard>
);

const DOCS: { client: string; amount: string; status: StatusKey }[] = [
  { client: 'Harbor Café', amount: '$860.00', status: 'paid' },
  { client: 'Nadia Home Reno', amount: '$2,400.00', status: 'partially_paid' },
  { client: 'Westside Dental', amount: '$740.00', status: 'overdue' },
];
const StatusArt = () => (
  <MockCard>
    {DOCS.map((d, i) => {
      const s = STATUS[d.status];
      return (
        <div key={d.client} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? `1px solid ${LIGHT.separator}` : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{d.client}</div>
            <div style={{ fontSize: 13, color: LIGHT.secondary }}>{d.amount}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.fg, fontSize: 13, fontWeight: 600 }}>
            <Icon name={s.icon} size={13} weight={2.4} color={s.fg} />
            {s.label}
          </div>
        </div>
      );
    })}
    <div style={{ marginTop: 8, borderRadius: 16, background: LIGHT.grouped, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="bell" size={16} weight={2.2} color={LIGHT.tint} />
      <div style={{ flex: 1, fontSize: 13 }}>Reminder ready for Westside Dental</div>
    </div>
  </MockCard>
);

const PAGES = [
  { Art: SummaryArt, title: 'Get Paid for Your Work, Faster', body: 'Estimates, invoices and payments for your business, all from your iPhone.' },
  { Art: EstimateArt, title: 'Quote on the Spot', body: 'Write an estimate on site, get it signed on your screen, and turn it into an invoice in one tap.' },
  { Art: PdfArt, title: 'Look Professional, Get Paid in Seconds', body: 'Every PDF carries your logo and terms, plus a Pay button and QR code for your payment link.' },
  { Art: StatusArt, title: 'Always Know Who Has Paid', body: 'Paid, partly paid and overdue update on their own, and reminders help you chase late payments.' },
];

const WelcomePage: React.FC<{ index: number }> = ({ index }) => {
  const { Art, title, body } = PAGES[index];
  const last = index === PAGES.length - 1;
  return (
    <Screen>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 59, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, padding: '0 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: 17, color: LIGHT.tint }}>{last ? '' : 'Skip'}</div>
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            <Art />
          </div>
          <div style={{ fontSize: 28, lineHeight: '34px', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 17, lineHeight: '22px', color: LIGHT.secondary, textAlign: 'center' }}>{body}</div>
        </div>
        <div style={{ padding: '24px 24px 42px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{ height: 8, width: i === index ? 22 : 8, borderRadius: 4, background: i === index ? LIGHT.tint : '#E9E9EE' }} />
            ))}
          </div>
          <AppButton label={last ? 'Get Started' : 'Continue'} variant="filled" large />
          <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: LIGHT.tint }}>I Already Have an Account</div>
        </div>
      </div>
    </Screen>
  );
};

// ---------------------------------------------------------------------------------------------
// Paywall (app/paywall.tsx), after setup, with an intro offer

const Row: React.FC<{ icon?: React.ReactNode; title: string; subtitle?: string; value?: string; check?: boolean; last?: boolean }> = ({ icon, title, subtitle, value, check, last }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '10px 16px' }}>
      {icon ? <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}>{icon}</div> : null}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, lineHeight: '22px' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 15, lineHeight: '20px', color: LIGHT.secondary, marginTop: 2 }}>{subtitle}</div> : null}
      </div>
      {value ? <div style={{ fontSize: 17, fontWeight: 600 }}>{value}</div> : null}
      {check ? <Icon name="check" size={17} weight={2.6} color={LIGHT.tint} /> : null}
    </div>
    {last ? null : <Hairline inset={icon ? 58 : 16} />}
  </div>
);
const Banknote = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={LIGHT.tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
const tint = (n: IconName) => <Icon name={n} size={21} weight={2} color={LIGHT.tint} />;

const Paywall: React.FC<{ scroll: number }> = ({ scroll }) => (
  <Screen>
    <div style={{ position: 'absolute', left: 0, right: 0, top: -scroll, padding: '83px 16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32, padding: '0 16px' }}>
        <div style={{ width: '100%', background: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Northwind Studio" color={AVATAR_COLORS[3]} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Northwind Studio</div>
            <div style={{ fontSize: 13, color: LIGHT.secondary }}>Invoice · Ready to send</div>
          </div>
          <SymbolFill kind="check" color={LIGHT.tint} size={28} />
        </div>
        <div style={{ fontSize: 34, lineHeight: '41px', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center' }}>Invoice Them Pro</div>
        <div style={{ fontSize: 17, lineHeight: '22px', color: LIGHT.secondary, textAlign: 'center' }}>Northwind Studio is all set up. Subscribe to send your first invoice.</div>
      </div>
      <Section>
        <Row icon={tint('doc')} title="Unlimited Documents" subtitle="Estimates and invoices, as many as you need" />
        <Row icon={tint('signature')} title="Your Brand" subtitle="PDFs with your logo and signatures" />
        <Row icon={<Banknote />} title="Get Paid" subtitle="Payment tracking and overdue reminders" />
        <Row icon={tint('repeat')} title="Recurring Invoices" subtitle="Drafts created for you on schedule" last />
      </Section>
      <Section header="How It Works">
        <Row icon={<SymbolFill kind="check" color={LIGHT.tint} size={21} />} title="Today" subtitle="Full access to everything, $0.99 for 1 month" />
        <Row icon={tint('repeat')} title="After That" subtitle="$79.99 per year. Cancel anytime in Settings." last />
      </Section>
      <Section header="Choose a Plan">
        <Row title="Yearly" subtitle="Save 33% · $6.67/month" value="$79.99" check />
        <Row title="Monthly" value="$9.99" last />
      </Section>
      <div style={{ fontSize: 13, lineHeight: '18px', color: LIGHT.secondary, padding: '0 16px' }}>
        $0.99 for 1 month, then $79.99 per year. Payment is charged to your Apple ID. The subscription renews automatically unless you turn it off at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 13, color: LIGHT.tint, lineHeight: '44px' }}>
        <span>Privacy Policy</span>
        <span>Terms of Use</span>
        <span>Sign Out</span>
        <span>Delete Account</span>
      </div>
      <div style={{ height: 240 }} />
    </div>
    <div style={{ position: 'absolute', left: 16, right: 16, bottom: 34, borderRadius: 34, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, ...glass({ background: 'rgba(250,250,252,0.86)' }) }}>
      <div style={{ fontSize: 13, color: LIGHT.secondary, textAlign: 'center', paddingTop: 4 }}>$0.99 for 1 month, then $79.99/year</div>
      <AppButton label="Start for $0.99" variant="filled" large />
      <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 500, color: LIGHT.tint }}>Restore Purchases</div>
    </div>
  </Screen>
);

// ---------------------------------------------------------------------------------------------
// Compositions

const PW = 500;
const phoneH = (w: number) => ((852 * (w * 0.928)) / 393) + w * 0.072;
const Cap: React.FC<{ title: string; note?: string; left: number; top: number; width: number }> = ({ title, note, left, top, width }) => (
  <div style={{ position: 'absolute', left, top, width, textAlign: 'center', fontFamily: FONT, color: PAL.midnight }}>
    <div style={{ fontFamily: BRAND_FONT, fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>{title}</div>
    {note ? <div style={{ fontSize: 26, opacity: 0.62, marginTop: 6, lineHeight: 1.3 }}>{note}</div> : null}
  </div>
);

export const WELCOME_W = 4 * PW + 5 * 60;
export const WELCOME_H = Math.round(240 + phoneH(PW) + 140);
export const WelcomeTour: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 60, top: 60, color: PAL.midnight }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em' }}>The new welcome tour</div>
      <div style={{ fontSize: 30, opacity: 0.62, marginTop: 8 }}>Four pages, shown once per device before sign-up. A mockup drawn from the code in PR #8, not a device capture.</div>
    </div>
    {PAGES.map((p, i) => (
      <React.Fragment key={p.title}>
        <Phone width={PW} lightScreen shadow="0 50px 100px rgba(18,17,43,0.22)" style={{ left: 60 + i * (PW + 60), top: 240 }}>
          <WelcomePage index={i} />
        </Phone>
        <Cap left={60 + i * (PW + 60)} top={240 + phoneH(PW) + 28} width={PW} title={`Page ${i + 1} of 4`} note={i === 3 ? 'Get Started goes to sign-up' : 'Continue, or Skip to the last page'} />
      </React.Fragment>
    ))}
  </AbsoluteFill>
);

export const PAYWALL_W = 2 * PW + 3 * 80;
export const PAYWALL_H = Math.round(240 + phoneH(PW) + 200);
export const PaywallNew: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 80, top: 60, color: PAL.midnight }}>
      <div style={{ fontFamily: BRAND_FONT, fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em' }}>The paywall</div>
      <div style={{ fontSize: 30, opacity: 0.62, marginTop: 8 }}>With the $0.99 intro offer. A mockup from PR #8’s code.</div>
    </div>
    {[0, 1].map((i) => (
      <React.Fragment key={i}>
        <Phone width={PW} lightScreen shadow="0 50px 100px rgba(18,17,43,0.22)" style={{ left: 80 + i * (PW + 80), top: 240 }}>
          <Paywall scroll={i === 0 ? 0 : 430} />
        </Phone>
        <Cap left={80 + i * (PW + 80)} top={240 + phoneH(PW) + 28} width={PW} title={i === 0 ? 'Top' : 'Scrolled'} note={i === 0 ? 'The button shows what you pay today' : 'New: “How It Works”, then the plans'} />
      </React.Fragment>
    ))}
  </AbsoluteFill>
);
