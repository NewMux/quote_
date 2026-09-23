import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button } from '../src/components/Button';
import { APPLE_EULA_URL, annualSavingsPercent, trialLabel } from '../src/lib/subscription';
import { BRAND } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useSubscriptionStore } from '../src/stores/useSubscriptionStore';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'document-text-outline', text: 'Unlimited invoices and estimates' },
  { icon: 'create-outline', text: 'PDFs with your logo and signatures' },
  { icon: 'cash-outline', text: 'Payment tracking and overdue reminders' },
  { icon: 'repeat-outline', text: 'Recurring invoices' },
];

type PlanKind = 'annual' | 'monthly';

function PlanCard({
  title,
  price,
  detail,
  badge,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  detail: string | null;
  badge: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${price}${detail ? `, ${detail}` : ''}`}
    >
      <View
        className={`bg-white rounded-2xl p-4 flex-row items-center gap-3 border-2 ${
          selected ? 'border-brand' : 'border-gray-100'
        }`}
      >
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={selected ? BRAND.default : '#9CA3AF'}
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-gray-900">{title}</Text>
            {badge ? (
              <View className="bg-brand/10 rounded-full px-2 py-0.5">
                <Text className="text-xs font-semibold text-brand">{badge}</Text>
              </View>
            ) : null}
          </View>
          {detail ? <Text className="text-xs text-gray-500 mt-0.5">{detail}</Text> : null}
        </View>
        <Text className="text-base font-semibold text-gray-900">{price}</Text>
      </View>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const isPro = useSubscriptionStore((s) => s.isPro);
  const offering = useSubscriptionStore((s) => s.offering);
  const loadOffering = useSubscriptionStore((s) => s.loadOffering);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const signOut = useAuthStore((s) => s.signOut);

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
    if (isPro) router.replace('/(tabs)/home');
  }, [isPro]);

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
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Something went wrong.');
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
          'Nothing to restore',
          'No active subscription was found for the Apple ID signed in on this device.'
        );
      }
    } catch (err) {
      Alert.alert('Could not restore', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      Alert.alert('Could not sign out', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const renewalText = selected
    ? `${trial ? `After the ${trial}, ` : ''}${selected.product.priceString} per ${
        selectedKind === 'annual' ? 'year' : 'month'
      }. Payment is charged to your Apple ID. The subscription renews automatically unless you turn it off at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings.`
    : null;

  return (
    <View className="flex-1 bg-surface">
      <LinearGradient colors={[BRAND.default, BRAND.darker]}>
        <SafeAreaView edges={['top']}>
          <View className="px-6 pt-6 pb-8 items-center gap-2">
            <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-1">
              <Ionicons name="receipt" size={28} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white text-center">Invoice Them Pro</Text>
            <Text className="text-sm text-white/80 text-center">
              Everything you need to quote, invoice, and get paid.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View className="gap-3">
          {BENEFITS.map((benefit) => (
            <View key={benefit.text} className="flex-row items-center gap-3">
              <Ionicons name={benefit.icon} size={20} color={BRAND.default} />
              <Text className="text-base text-gray-900 flex-1">{benefit.text}</Text>
            </View>
          ))}
        </View>

        {loadError ? (
          <View className="bg-white rounded-2xl p-4 gap-3 items-center border border-gray-100">
            <Text className="text-sm text-gray-700 text-center">
              Couldn&apos;t load subscription options. Check your connection and try again.
            </Text>
            <Button label="Try Again" variant="tinted" onPress={fetchOffering} />
          </View>
        ) : !offering ? (
          <ActivityIndicator style={{ paddingVertical: 24 }} />
        ) : (
          <View className="gap-3" accessibilityRole="radiogroup">
            {annual ? (
              <PlanCard
                title="Yearly"
                price={annual.product.priceString}
                detail={annual.product.pricePerMonthString ? `${annual.product.pricePerMonthString}/month` : null}
                badge={savings ? `Save ${savings}%` : null}
                selected={selectedKind === 'annual'}
                onPress={() => setPlan('annual')}
              />
            ) : null}
            {monthly ? (
              <PlanCard
                title="Monthly"
                price={monthly.product.priceString}
                detail={null}
                badge={null}
                selected={selectedKind === 'monthly'}
                onPress={() => setPlan('monthly')}
              />
            ) : null}
          </View>
        )}

        <View className="gap-2">
          <Button
            label={isWorking ? 'Please wait…' : trial ? `Start ${trial}` : 'Subscribe'}
            size="large"
            onPress={handlePurchase}
            disabled={!selected || isWorking}
          />
          <Button label="Restore Purchases" variant="plain" onPress={handleRestore} disabled={isWorking} />
        </View>

        {renewalText ? <Text className="text-xs text-gray-500 leading-4">{renewalText}</Text> : null}

        <View className="flex-row justify-center gap-6">
          <Pressable onPress={() => router.push('/privacy-policy')} hitSlop={8}>
            <Text className="text-xs text-brand">Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(APPLE_EULA_URL)} hitSlop={8}>
            <Text className="text-xs text-brand">Terms of Use</Text>
          </Pressable>
          <Pressable onPress={handleSignOut} hitSlop={8}>
            <Text className="text-xs text-gray-500">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
