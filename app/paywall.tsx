import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../src/components/Button';
import { GlassBar } from '../src/components/GlassBar';
import { Avatar } from '../src/components/Avatar';
import { Icon } from '../src/components/Icon';
import { ListRow } from '../src/components/list/ListRow';
import { ListSection } from '../src/components/list/ListSection';
import { APPLE_EULA_URL, annualSavingsPercent, trialLabel } from '../src/lib/subscription';
import type { SymbolName } from '../src/lib/symbols';
import { useSignedUrl } from '../src/lib/useSignedUrl';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../src/stores/useBusinessProfileStore';
import { useSubscriptionStore } from '../src/stores/useSubscriptionStore';

const BENEFITS: { icon: SymbolName; title: string; detail: string }[] = [
  { icon: 'doc.on.doc.fill', title: 'Unlimited Documents', detail: 'Estimates and invoices, as many as you need' },
  { icon: 'signature', title: 'Your Brand', detail: 'PDFs with your logo and signatures' },
  { icon: 'banknote.fill', title: 'Get Paid', detail: 'Payment tracking and overdue reminders' },
  { icon: 'repeat', title: 'Recurring Invoices', detail: 'Drafts created for you on schedule' },
];

type PlanKind = 'annual' | 'monthly';

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" className="min-h-[44px] justify-center px-1">
      <Text className="text-footnote text-tint">{label}</Text>
    </Pressable>
  );
}

/** Where to go after subscribing: an in-app path passed by the screen that sent us here. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/(tabs)/home';
}

export default function PaywallScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const profile = useBusinessProfileStore((s) => s.profile);
  const logoUrl = useSignedUrl(profile?.logo_uri);
  const businessName = profile?.business_name?.trim() ?? '';
  const isPro = useSubscriptionStore((s) => s.isPro);
  const offering = useSubscriptionStore((s) => s.offering);
  const loadOffering = useSubscriptionStore((s) => s.loadOffering);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const signOut = useAuthStore((s) => s.signOut);
  const insets = useSafeAreaInsets();

  const [loadError, setLoadError] = useState(false);
  const [plan, setPlan] = useState<PlanKind>('annual');
  const [isWorking, setIsWorking] = useState(false);

  const fetchOffering = useCallback(() => {
    setLoadError(false);
    loadOffering().catch(() => setLoadError(true));
  }, [loadOffering]);

  useEffect(() => {
    fetchOffering();
  }, [fetchOffering]);

  useEffect(() => {
    if (isPro) router.replace(safeNext(next) as Href);
  }, [isPro, next]);

  const annual = offering?.annual ?? null;
  const monthly = offering?.monthly ?? null;
  const selected: PurchasesPackage | null = (plan === 'annual' ? annual : monthly) ?? annual ?? monthly;
  const selectedKind: PlanKind = selected === monthly ? 'monthly' : 'annual';
  const trial = trialLabel(selected?.product.introPrice);
  const savings =
    annual && monthly ? annualSavingsPercent(monthly.product.price, annual.product.price) : null;

  async function handlePurchase() {
    if (!selected) return;
    setIsWorking(true);
    try {
      await purchase(selected);
    } catch (err) {
      Alert.alert('Purchase Didn’t Go Through', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleRestore() {
    setIsWorking(true);
    try {
      const restored = await restore();
      if (!restored) {
        Alert.alert(
          'Nothing to Restore',
          'No active subscription was found for the Apple ID signed in on this device.'
        );
      }
    } catch (err) {
      Alert.alert('Couldn’t Restore Purchases', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      Alert.alert('Couldn’t Sign Out', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const renewalText = selected
    ? `${trial ? `After the ${trial}, ` : ''}${selected.product.priceString} per ${
        selectedKind === 'annual' ? 'year' : 'month'
      }. Payment is charged to your Apple ID. The subscription renews automatically unless you turn it off at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings.`
    : null;

  return (
    <View className="flex-1 bg-grouped">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 180,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Apple's subscription-sheet layout: what they've set up, the name, the promise, then what
            you get. A preview of their own invoice header shows the setup already paying off. */}
        <View className="items-center gap-2 mb-8 px-4">
          {businessName ? (
            <View
              className="w-full bg-card rounded-3xl p-4 mb-3 flex-row items-center gap-3"
              style={{ borderCurve: 'continuous' }}
              accessible
              accessibilityLabel={`Invoice preview for ${businessName}`}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} className="w-14 h-14 rounded-xl bg-white" resizeMode="contain" />
              ) : (
                <Avatar name={businessName} seed={businessName} size={56} />
              )}
              <View className="flex-1">
                <Text className="text-headline font-semibold text-label" numberOfLines={1}>
                  {businessName}
                </Text>
                <Text className="text-footnote text-secondary">Invoice · Ready to send</Text>
              </View>
              <Icon name="checkmark.circle.fill" size={28} />
            </View>
          ) : (
            <View
              className="w-20 h-20 rounded-[22px] bg-brand items-center justify-center mb-2"
              style={{ borderCurve: 'continuous' }}
            >
              <Icon name="doc.text.fill" size={40} color="#FFFFFF" />
            </View>
          )}
          <Text className="text-largetitle font-bold text-label text-center" accessibilityRole="header">
            Invoice Them Pro
          </Text>
          <Text className="text-body text-secondary text-center">
            {businessName
              ? `${businessName} is all set up. Start your free trial to send your first invoice.`
              : 'Everything you need to quote, invoice, and get paid.'}
          </Text>
        </View>

        <ListSection>
          {BENEFITS.map((benefit) => (
            <ListRow key={benefit.title} icon={benefit.icon} title={benefit.title} subtitle={benefit.detail} />
          ))}
        </ListSection>

        {loadError ? (
          <ListSection footer="Couldn’t load subscription options. Check your connection and try again.">
            <ListRow title="Try Again" onPress={fetchOffering} centered />
          </ListSection>
        ) : !offering ? (
          <ActivityIndicator style={{ paddingVertical: 24 }} accessibilityLabel="Loading plans" />
        ) : (
          <ListSection header="Choose a Plan">
            {annual ? (
              <ListRow
                title="Yearly"
                subtitle={[
                  savings ? `Save ${savings}%` : null,
                  annual.product.pricePerMonthString ? `${annual.product.pricePerMonthString}/month` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined}
                value={annual.product.priceString}
                valueClassName="text-label font-semibold"
                onPress={() => setPlan('annual')}
                accessory={selectedKind === 'annual' ? 'checkmark' : 'none'}
              />
            ) : null}
            {monthly ? (
              <ListRow
                title="Monthly"
                value={monthly.product.priceString}
                valueClassName="text-label font-semibold"
                onPress={() => setPlan('monthly')}
                accessory={selectedKind === 'monthly' ? 'checkmark' : 'none'}
              />
            ) : null}
          </ListSection>
        )}

        {renewalText ? <Text className="text-footnote text-secondary px-4">{renewalText}</Text> : null}

        <View className="flex-row flex-wrap justify-center gap-x-4 mt-3">
          <FooterLink label="Privacy Policy" onPress={() => router.push('/privacy-policy')} />
          <FooterLink label="Terms of Use" onPress={() => Linking.openURL(APPLE_EULA_URL)} />
          <FooterLink label="Sign Out" onPress={handleSignOut} />
        </View>
      </ScrollView>

      <View
        className="absolute left-0 right-0 bottom-0 px-4"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        pointerEvents="box-none"
      >
        <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <GlassBar>
            {trial && selected ? (
              <Text className="text-footnote text-secondary text-center pt-1">
                {`${trial}, then ${selected.product.priceString}/${selectedKind === 'annual' ? 'year' : 'month'}`}
              </Text>
            ) : null}
            <Button
              label={trial ? 'Start Free Trial' : 'Subscribe'}
              size="large"
              onPress={handlePurchase}
              disabled={!selected}
              loading={isWorking}
            />
            <Button label="Restore Purchases" variant="plain" size="small" onPress={handleRestore} disabled={isWorking} />
          </GlassBar>
        </View>
      </View>
    </View>
  );
}
