import React from 'react';
import { Freeze } from 'remotion';
import { AppMark } from '../components/Bits';
import { Icon } from '../components/Icon';
import { BRAND, TAGLINE } from '../brand';
import { FONT } from '../theme';
import { CONTACTS } from '../v2/scenes/ContactsV2';
import { BENTO } from '../v2/scenes/BentoV2';
import { CREATE_ADDS } from '../v2/scenes/CreateV2';
import { PAID } from '../v2/scenes/PaidV2';
import { PAY } from '../v2/scenes/PayV2';
import { SIGN } from '../v2/scenes/SignV2';
import { FloatCard } from '../v2/kit';
import { DetailLight, EditorLight, NewClientLight, PdfV2, ScanPay, SignLight } from '../v2/screens';
import { ACCENT, NIGHT } from '../v2/theme';
import { STORE_W, StoreFrame, StorePhone, THEMES } from './layout';

/** A FloatCard sized for the 1320 px canvas, hanging off the phone's edge. */
const Card: React.FC<React.ComponentProps<typeof FloatCard>> = ({ style, ...props }) => (
  <FloatCard {...props} style={{ scale: 1.42, transformOrigin: '0% 0%', zIndex: 10, ...style }} />
);

// ---------------------------------------------------------------------------------------------

const CREATE_AT = 150;

export const ShotCreate: React.FC = () => (
  <StoreFrame theme={THEMES.blue} lines={['Create invoices', 'in *seconds.*']} sub="Add your items. Totals, tax and numbering take care of themselves.">
    <StorePhone top={710}>
      <Freeze frame={CREATE_AT}>
        <EditorLight f={CREATE_AT} adds={CREATE_ADDS} />
      </Freeze>
    </StorePhone>
    <Card icon={<Icon name="doc" size={40} color="#fff" weight={2.4} />} color={ACCENT.blue} title="Invoice total" value="$4,290.00" style={{ left: 40, top: 2610 }} />
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

const CONTACTS_AT = 160;

export const ShotContacts: React.FC = () => (
  <StoreFrame theme={THEMES.orange} lines={['Add clients from', 'your *contacts.*']} sub="One tap fills in the name, email, phone and address.">
    <StorePhone top={710}>
      <Freeze frame={CONTACTS_AT}>
        <NewClientLight f={CONTACTS_AT} tapAt={CONTACTS.tapFill} fillAt={CONTACTS.fill} />
      </Freeze>
    </StorePhone>
    <Card icon={<Icon name="people" size={40} color="#fff" weight={2.2} />} color={ACCENT.orange} title="From Contacts" value="Lina Haddad" style={{ left: 640, top: 2610 }} />
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

const SIGN_AT = 110;

export const ShotSign: React.FC = () => (
  <StoreFrame theme={THEMES.violet} lines={['Signed on', 'the *spot.*']} sub="You and your client sign right on the phone. It prints on the PDF.">
    <StorePhone top={710}>
      <Freeze frame={SIGN_AT}>
        <SignLight f={SIGN_AT} drawStart={SIGN.start} drawEnd={SIGN.end} doneAt={SIGN.done} />
      </Freeze>
    </StorePhone>
    <Card icon={<Icon name="signature" size={40} color="#fff" weight={2.2} />} color={ACCENT.violet} title="Signed by" value="Harbor Coffee Co." style={{ left: 60, top: 2180 }} />
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

const PAY_AT = 100;

export const ShotPay: React.FC = () => (
  <StoreFrame theme={THEMES.pink} lines={['Every invoice has', 'a *pay link.*']} sub="Your client scans the QR code on the PDF and pays from their phone.">
    <div style={{ position: 'absolute', left: 80, top: 780, transformOrigin: '0% 0%', scale: 1.5, rotate: '-4deg' }}>
      <Freeze frame={PAY_AT}>
        <PdfV2 />
      </Freeze>
    </div>
    <StorePhone width={640} top={1560} style={{ left: 600, rotate: '3deg' }}>
      <Freeze frame={PAY_AT}>
        <ScanPay f={PAY_AT} detectAt={PAY.detect} sheetAt={PAY.sheet} payAt={PAY.pay} />
      </Freeze>
    </StorePhone>
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

const PAID_AT = 120;

export const ShotPaid: React.FC = () => (
  <StoreFrame theme={THEMES.green} lines={['See who’s *paid,*', 'at a glance.']} sub="Payments update the balance and status the moment you log them.">
    <StorePhone top={710}>
      <Freeze frame={PAID_AT}>
        <DetailLight f={PAID_AT} paidAt={PAID.paid} />
      </Freeze>
    </StorePhone>
    <div
      style={{
        position: 'absolute',
        left: 150,
        right: 150,
        top: 900,
        padding: '30px 34px',
        borderRadius: 48,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 40px 80px rgba(6,40,24,0.30)',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        fontFamily: FONT,
        zIndex: 10,
      }}
    >
      <div style={{ width: 96, height: 96, borderRadius: 22, background: 'linear-gradient(150deg, #2FB58C, #157A63)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: '#111114' }}>Payment received</div>
        <div style={{ fontSize: 36, color: '#3A3A3F' }}>Harbor Coffee Co. paid $4,290.00</div>
      </div>
      <div style={{ fontSize: 30, color: '#8E8E93', alignSelf: 'flex-start' }}>now</div>
    </div>
    <Card icon={<Icon name="checkCircle" size={40} color="#fff" weight={2.4} />} color={ACCENT.green} title="Paid this month" value="$12,840" style={{ left: 60, top: 2230 }} />
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

const BENTO_W = 940;
const BENTO_SCALE = (STORE_W - 2 * 80) / BENTO_W;

export const ShotMore: React.FC = () => (
  <StoreFrame theme={THEMES.night} night lines={['And so much', '*more.*']} sub="Everything you need to get paid.">
    <div style={{ position: 'absolute', left: 80, top: 740, width: BENTO_W, transformOrigin: '0% 0%', scale: BENTO_SCALE }}>
      {BENTO.map((card) => {
        const wide = card.w === BENTO_W;
        return (
          <div
            key={card.title}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y,
              width: card.w,
              height: card.h,
              borderRadius: 40,
              background: 'rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12)',
              padding: 34,
              display: 'flex',
              flexDirection: wide ? 'row' : 'column',
              alignItems: wide ? 'center' : 'flex-start',
              justifyContent: wide ? 'flex-start' : 'space-between',
              gap: 28,
              fontFamily: FONT,
            }}
          >
            <div style={{ width: 96, height: 96, borderRadius: 28, background: card.color === '#111114' ? ACCENT.green : card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={card.icon} size={54} color="#fff" weight={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1.1 }}>{card.title}</div>
              <div style={{ fontSize: 30, fontWeight: 500, color: NIGHT.secondary, marginTop: 8, lineHeight: 1.25 }}>{card.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, fontFamily: FONT, color: '#fff' }}>
      <AppMark size={210} style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.20), 0 30px 90px rgba(123,97,255,0.55)' }} />
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: '-0.04em' }}>Invoice Them</div>
      <div style={{ fontSize: 48, fontWeight: 500, color: BRAND.lime, letterSpacing: '-0.01em' }}>{TAGLINE}</div>
    </div>
  </StoreFrame>
);

// ---------------------------------------------------------------------------------------------

export const SHOTS = [
  { id: 'Store1Create', file: '01-create', Component: ShotCreate },
  { id: 'Store2Contacts', file: '02-contacts', Component: ShotContacts },
  { id: 'Store3Sign', file: '03-sign', Component: ShotSign },
  { id: 'Store4Pay', file: '04-pay', Component: ShotPay },
  { id: 'Store5Paid', file: '05-paid', Component: ShotPaid },
  { id: 'Store6More', file: '06-more', Component: ShotMore },
] as const;
