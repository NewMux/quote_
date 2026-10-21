import React from 'react';
import { AppMark } from '../components/Bits';
import { Icon } from '../components/Icon';
import { TAGLINE } from '../brand';
import { BRAND_FONT } from '../brand';
import { FONT } from '../theme';
import { ClientsScreen, DetailScreen, DocumentsScreen, SignSheet, SummaryScreen } from './app/screens';
import { Canvas, Device, MARGIN, PAL, STORE_W, ScreenPanel, TextBlock } from './design';
import { PdfPage } from './pdf';

// Seven screenshots, one idea each, in this order. The screens are rebuilt from the app's own
// source (app/screens.tsx) and the PDF is the app's real template output (pdf.tsx).

/** 1. The promise, over the Summary tab. */
export const ShotSummary: React.FC = () => (
  <Canvas bg={PAL.midnight}>
    <TextBlock
      top={150}
      size={206}
      color={PAL.white}
      accent={PAL.lime}
      lines={['Bill it.', 'Send it.', '*Get paid.*']}
      sub="Estimates and invoices for people who’d rather be doing the work."
    />
    <Device left={110} top={1010} width={1100} shadow="0 0 0 2px rgba(255,255,255,0.06), 0 60px 120px rgba(0,0,0,0.55)">
      <SummaryScreen />
    </Device>
  </Canvas>
);

/** 2. Documents, zoomed in with no device. */
export const ShotDocuments: React.FC = () => (
  <Canvas bg={PAL.paper}>
    <TextBlock
      top={150}
      color={PAL.midnight}
      accent={PAL.violet}
      lines={['Every estimate', 'and invoice,', '*one list.*']}
      sub="Search, filter and see where each one stands at a glance."
    />
    <ScreenPanel left={60} top={1010} width={1200} height={2000} offsetY={50}>
      <DocumentsScreen />
    </ScreenPanel>
  </Canvas>
);

/** 3. The detail screen's big button, with the phone hanging in from the top. */
export const ShotDetail: React.FC = () => (
  <Canvas bg={PAL.violet}>
    <Device left={110} top={-170} width={1100} shadow="0 60px 120px rgba(18,17,43,0.45)">
      <DetailScreen />
    </Device>
    <TextBlock
      bottom={118}
      color={PAL.white}
      accent={PAL.lime}
      lines={['Always one tap', 'from *paid.*']}
      sub="Issue it, log a payment or send a reminder. The big button knows what’s next."
    />
  </Canvas>
);

/** 4. Signing on the phone, and where the signature lands on the PDF. */
export const ShotSign: React.FC = () => (
  <Canvas bg={PAL.lime}>
    <TextBlock
      top={150}
      color={PAL.midnight}
      accent={PAL.violet}
      lines={['Signed on', 'the *spot.*']}
      sub="Draw your signature on the phone. It prints on the PDF."
    />
    <ScreenPanel left={96} top={880} width={1000} height={1380} radius={84} shadow="0 50px 100px rgba(18,17,43,0.28)">
      <SignSheet />
    </ScreenPanel>
    <div style={{ position: 'absolute', left: 300, top: 1900, width: 930, height: 760, borderRadius: 40, overflow: 'hidden', background: '#fff', boxShadow: '0 50px 100px rgba(18,17,43,0.35)' }}>
      <div style={{ position: 'absolute', left: -SIG_CROP.x * SIG_CROP.s, top: -SIG_CROP.y * SIG_CROP.s, transform: `scale(${SIG_CROP.s})`, transformOrigin: '0 0' }}>
        <PdfPage height={1000} />
      </div>
    </div>
  </Canvas>
);
const SIG_CROP = { x: 4, y: 500, s: 1.52 };

/** 5. The pay link, on the PDF itself. */
export const ShotPay: React.FC = () => (
  <Canvas bg={PAL.midnight}>
    <TextBlock
      top={150}
      color={PAL.white}
      accent={PAL.lime}
      lines={['Every invoice', 'has a *pay link.*']}
      sub="A QR code and a Pay button on the PDF take clients straight to your payment page."
    />
    <div style={{ position: 'absolute', left: 48, top: 900, transform: 'scale(2.0)', transformOrigin: '0 0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
      <PdfPage height={1000} />
    </div>
  </Canvas>
);

/** 6. Clients. */
export const ShotClients: React.FC = () => (
  <Canvas bg={PAL.paper}>
    <TextBlock
      top={150}
      color={PAL.midnight}
      accent={PAL.violet}
      lines={['Everyone you', 'bill, *A to Z.*']}
      sub="Add clients straight from your contacts."
    />
    <Device left={160} top={1000} width={1000} shadow="0 60px 110px rgba(18,17,43,0.28)">
      <ClientsScreen />
    </Device>
  </Canvas>
);

/** 7. The rest of the features, and the app. */
const MORE = [
  { icon: 'repeat', title: 'Recurring invoices', sub: 'Drafts ready on your schedule', wide: true },
  { icon: 'bell', title: 'Reminders', sub: 'For overdue invoices' },
  { icon: 'photo', title: 'Your logo', sub: 'On every PDF' },
  { icon: 'moon', title: 'Light & Dark', sub: 'Follows your iPhone' },
  { icon: 'arrowRight', title: 'Estimates', sub: 'Turn into invoices in a tap' },
  { icon: 'lock', title: 'Secure cloud sync', sub: 'Your data, on every device', wide: true },
] as const;

export const ShotMore: React.FC = () => (
  <Canvas bg={PAL.violet}>
    <TextBlock top={150} color={PAL.white} accent={PAL.lime} lines={['And so much', '*more.*']} sub="Everything you need to get paid." />
    <div style={{ position: 'absolute', left: 96, right: 96, top: 900, display: 'flex', flexWrap: 'wrap', gap: 28 }}>
      {MORE.map((m) => (
        <div
          key={m.title}
          style={{
            width: 'wide' in m ? '100%' : (STORE_W - 192 - 28) / 2,
            height: 'wide' in m ? 220 : 300,
            borderRadius: 52,
            background: PAL.white,
            padding: 40,
            display: 'flex',
            flexDirection: 'wide' in m ? 'row' : 'column',
            alignItems: 'wide' in m ? 'center' : 'flex-start',
            justifyContent: 'wide' in m ? 'flex-start' : 'space-between',
            gap: 32,
            fontFamily: FONT,
            color: PAL.midnight,
          }}
        >
          <div style={{ width: 100, height: 100, borderRadius: 30, background: PAL.midnight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={m.icon} size={54} color={PAL.lime} weight={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: BRAND_FONT, fontSize: 54, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 }}>{m.title}</div>
            <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.62, marginTop: 8 }}>{m.sub}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ position: 'absolute', left: MARGIN, right: MARGIN, bottom: 130, display: 'flex', alignItems: 'center', gap: 36, color: PAL.white }}>
      <AppMark size={180} />
      <div>
        <div style={{ fontFamily: BRAND_FONT, fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>Invoice Them</div>
        <div style={{ fontSize: 44, fontWeight: 600, color: PAL.lime, marginTop: 10 }}>{TAGLINE}</div>
      </div>
    </div>
  </Canvas>
);

export const SHOTS = [
  { id: 'Store1Summary', file: '01-summary', Component: ShotSummary },
  { id: 'Store2Documents', file: '02-documents', Component: ShotDocuments },
  { id: 'Store3Detail', file: '03-detail', Component: ShotDetail },
  { id: 'Store4Sign', file: '04-sign', Component: ShotSign },
  { id: 'Store5Pay', file: '05-pay', Component: ShotPay },
  { id: 'Store6Clients', file: '06-clients', Component: ShotClients },
  { id: 'Store7More', file: '07-more', Component: ShotMore },
] as const;
