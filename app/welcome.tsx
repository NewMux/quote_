// The first thing a new person sees: a short tour of what Invoice Them does, before they're asked to
// create an account, set up their business, or subscribe. Each page shows a small, real-looking
// slice of the app (built from the same status colors and badges), not a stock illustration.
import { useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { Button } from '../src/components/Button';
import { Icon } from '../src/components/Icon';
import { StatusBadge } from '../src/components/StatusBadge';
import { markIntroSeen } from '../src/lib/introSeen';
import { qrSvg } from '../src/lib/pdf/qrSvg';
import { useSystemColors, useThemeColors } from '../src/lib/theme';
import { isRTL, t } from '../src/lib/i18n';

/** Content stays readable on iPad and wide displays instead of stretching edge to edge. */
const MAX_WIDTH = 480;

function MockCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View
      className="w-full max-w-[340px] bg-card rounded-3xl p-5"
      style={{
        borderCurve: 'continuous',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      }}
      // Read as one sentence by VoiceOver rather than a pile of fake numbers.
      accessible
      accessibilityLabel={label}
    >
      {children}
    </View>
  );
}

function Placeholder({ width }: { width: `${number}%` }) {
  return <View className="h-2 rounded-full bg-fill mb-2" style={{ width }} />;
}

function SummaryArt() {
  const system = useSystemColors();
  const tiles = [
    { title: t('Outstanding'), value: '$4,280', color: system.orange, icon: 'clock.fill' as const },
    { title: t('Paid This Month'), value: '$9,615', color: system.green, icon: 'checkmark.circle.fill' as const },
    { title: t('Overdue'), value: '$740', color: system.red, icon: 'exclamationmark.circle.fill' as const },
  ];
  return (
    <MockCard label={t("A summary showing what's outstanding, paid this month, and overdue.")}>
      <Text className="text-footnote font-semibold text-secondary mb-1">{t('Summary')}</Text>
      {tiles.map((tile, i) => (
        <View
          key={tile.title}
          className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-separator' : ''}`}
        >
          <Icon name={tile.icon} size={22} color={tile.color} />
          <Text className="flex-1 text-subhead text-secondary">{tile.title}</Text>
          <Text className="text-headline font-semibold text-label" style={{ fontVariant: ['tabular-nums'] }}>
            {tile.value}
          </Text>
        </View>
      ))}
    </MockCard>
  );
}

function EstimateArt() {
  const system = useSystemColors();
  return (
    <MockCard label={t('An estimate signed by the client on screen, ready to convert into an invoice.')}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-headline font-semibold text-label">{t('Estimate EST-0042')}</Text>
        <View className="flex-row items-center gap-1">
          <Icon name="checkmark.circle.fill" size={15} color={system.green} />
          <Text className="text-footnote font-semibold" style={{ color: system.green }}>
            {t('Signed')}
          </Text>
        </View>
      </View>
      <Placeholder width="85%" />
      <Placeholder width="65%" />
      <Placeholder width="75%" />
      <View className="mt-2 rounded-2xl border border-dashed border-field p-3">
        <Text className="text-title2 italic font-light text-label">{t('J. Carter')}</Text>
        <View className="h-px bg-separator my-1" />
        <Text className="text-caption text-secondary">{t('Client signature')}</Text>
      </View>
      <View className="mt-4 rounded-full bg-brand py-2.5 items-center">
        <Text className="text-subhead font-semibold text-white">{t('Convert to Invoice')}</Text>
      </View>
    </MockCard>
  );
}

const SAMPLE_QR = qrSvg('https://example.com/pay/INV-0108', 64);

function PdfArt() {
  return (
    <MockCard label={t('An invoice PDF with your logo, the total due, a Pay Now button, and a QR code.')}>
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-10 h-10 rounded-xl bg-brand items-center justify-center" style={{ borderCurve: 'continuous' }}>
          <Text className="text-subhead font-bold text-white">{t('SP')}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-subhead font-semibold text-label">Sam&apos;s Plumbing</Text>
          <Text className="text-caption text-secondary">{t('Invoice INV-0108')}</Text>
        </View>
      </View>
      <Placeholder width="70%" />
      <Placeholder width="55%" />
      <View className="flex-row justify-between items-center border-t border-separator pt-3 mt-2 mb-4">
        <Text className="text-subhead text-secondary">{t('Total Due')}</Text>
        <Text className="text-title3 font-bold text-label">$1,250.00</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 rounded-full bg-brand py-2.5 items-center">
          <Text className="text-subhead font-semibold text-white">{t('Pay Now')}</Text>
        </View>
        <View className="rounded-lg overflow-hidden">
          <SvgXml xml={SAMPLE_QR} width={64} height={64} />
        </View>
      </View>
    </MockCard>
  );
}

// Sample documents for the badges. Overdue comes from a due date in the past, exactly as in the app.
const SAMPLE_DOCS = [
  { client: t('Harbor Café'), amount: '$860.00', doc: { status: 'paid', due_date: null, total_minor: 86000, amount_paid_minor: 86000 } },
  { client: t('Nadia Home Reno'), amount: '$2,400.00', doc: { status: 'partially_paid', due_date: '2999-12-31', total_minor: 240000, amount_paid_minor: 100000 } },
  { client: t('Westside Dental'), amount: '$740.00', doc: { status: 'issued', due_date: '2000-01-01', total_minor: 74000, amount_paid_minor: 0 } },
] as const;

function StatusArt() {
  return (
    <MockCard label={t('Invoices marked paid, partly paid, and overdue, with a reminder ready for the overdue one.')}>
      {SAMPLE_DOCS.map((row, i) => (
        <View
          key={row.client}
          className={`flex-row items-center py-3 gap-3 ${i > 0 ? 'border-t border-separator' : ''}`}
        >
          <View className="flex-1">
            <Text className="text-subhead font-semibold text-label">{row.client}</Text>
            <Text className="text-footnote text-secondary">{row.amount}</Text>
          </View>
          <StatusBadge document={row.doc} variant="inline" />
        </View>
      ))}
      <View className="mt-2 rounded-2xl bg-grouped px-3 py-2.5 flex-row items-center gap-2">
        <Icon name="bell.badge.fill" size={16} />
        <Text className="flex-1 text-footnote text-label">{t('Reminder ready for Westside Dental')}</Text>
      </View>
    </MockCard>
  );
}

const PAGES = [
  {
    key: 'summary',
    title: t('Get Paid for Your Work, Faster'),
    body: t('Estimates, invoices and payments for your business, all from your iPhone.'),
    Art: SummaryArt,
  },
  {
    key: 'estimate',
    title: t('Quote on the Spot'),
    body: t('Write an estimate on site, get it signed on your screen, and turn it into an invoice in one tap.'),
    Art: EstimateArt,
  },
  {
    key: 'pdf',
    title: t('Look Professional, Get Paid in Seconds'),
    body: t('Every PDF carries your logo and terms, plus a Pay button and QR code for your payment link.'),
    Art: PdfArt,
  },
  {
    key: 'status',
    title: t('Always Know Who Has Paid'),
    body: t('Paid, partly paid and overdue update on their own, and reminders help you chase late payments.'),
    Art: StatusArt,
  },
] as const;

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const listRef = useRef<FlatList<(typeof PAGES)[number]>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === PAGES.length - 1;

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  function goTo(i: number) {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  }

  function leave(to: '/(auth)/sign-up' | '/(auth)/sign-in') {
    markIntroSeen();
    router.replace(to);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <View className="h-11 px-5 flex-row justify-end items-center">
        {!isLast ? (
          <Pressable
            onPress={() => goTo(PAGES.length - 1)}
            accessibilityRole="button"
            accessibilityLabel={t('Skip Tour')}
            className="min-h-[44px] min-w-[44px] items-end justify-center"
          >
            <Text className="text-body text-tint">{t('Skip')}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* The pager itself stays left to right so its scroll offsets map to pages the same way in every
          language; each page flows in the language's own direction. */}
      <FlatList
        ref={listRef}
        style={{ direction: 'ltr' }}
        data={PAGES}
        keyExtractor={(page) => page.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item: { Art, title, body } }) => (
          <View style={{ width, direction: isRTL() ? 'rtl' : 'ltr' }} className="flex-1 px-6">
            <View className="flex-1 w-full self-center items-center" style={{ maxWidth: MAX_WIDTH }}>
              <View className="flex-1 w-full items-center justify-center py-4">
                <Art />
              </View>
              <Text className="text-title1 font-bold text-label text-center mb-2" accessibilityRole="header">
                {title}
              </Text>
              <Text className="text-body text-secondary text-center">{body}</Text>
            </View>
          </View>
        )}
      />

      <View className="px-6 pt-6 pb-2 w-full self-center gap-2" style={{ maxWidth: MAX_WIDTH }}>
        <View
          className="flex-row justify-center gap-1.5 mb-3"
          style={{ direction: 'ltr' }}
          accessible
          accessibilityLabel={t('Page {current} of {total}', { current: index + 1, total: PAGES.length })}
        >
          {PAGES.map((page, i) => (
            <View
              key={page.key}
              className="h-2 rounded-full"
              style={{ width: i === index ? 22 : 8, backgroundColor: i === index ? colors.tint : colors.fill }}
            />
          ))}
        </View>
        <Button
          label={isLast ? t('Get Started') : t('Continue')}
          size="large"
          onPress={() => (isLast ? leave('/(auth)/sign-up') : goTo(index + 1))}
        />
        <Button label={t('I Already Have an Account')} variant="plain" onPress={() => leave('/(auth)/sign-in')} />
      </View>
    </SafeAreaView>
  );
}
