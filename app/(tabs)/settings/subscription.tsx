import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { format } from 'date-fns';
import Purchases from 'react-native-purchases';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { APPLE_MANAGE_SUBSCRIPTIONS_URL, ENTITLEMENT_ID } from '../../../src/lib/subscription';
import { useSubscriptionStore } from '../../../src/stores/useSubscriptionStore';

function planName(productId: string): string {
  if (/annual|year/i.test(productId)) return 'Yearly';
  if (/month/i.test(productId)) return 'Monthly';
  return 'Invoice Them Pro';
}

export default function SubscriptionScreen() {
  const isAvailable = useSubscriptionStore((s) => s.isAvailable);
  const customerInfo = useSubscriptionStore((s) => s.customerInfo);
  const restore = useSubscriptionStore((s) => s.restore);
  const [isRestoring, setIsRestoring] = useState(false);

  const entitlement = customerInfo?.entitlements.active[ENTITLEMENT_ID] ?? null;
  const dateText = entitlement?.expirationDate
    ? `${entitlement.willRenew ? 'Renews' : 'Ends'} ${format(new Date(entitlement.expirationDate), 'MMM d, yyyy')}`
    : null;

  async function handleManage() {
    try {
      if (isAvailable) {
        await Purchases.showManageSubscriptions();
      } else {
        await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
      }
    } catch {
      await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      const restored = await restore();
      Alert.alert(
        restored ? 'Purchases restored' : 'Nothing to restore',
        restored
          ? 'Your subscription is active on this account.'
          : 'No active subscription was found for the Apple ID signed in on this device.'
      );
    } catch (err) {
      Alert.alert('Could not restore', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card className="gap-1">
        {!isAvailable ? (
          <>
            <Text className="text-base font-semibold text-gray-900">Development build</Text>
            <Text className="text-sm text-gray-500">
              Subscriptions aren&apos;t set up in this build, so every feature is unlocked.
            </Text>
          </>
        ) : entitlement ? (
          <>
            <Text className="text-base font-semibold text-gray-900">
              Invoice Them Pro · {planName(entitlement.productIdentifier)}
            </Text>
            <Text className="text-sm text-gray-500">
              {entitlement.periodType === 'TRIAL' ? 'Free trial' : 'Active'}
              {dateText ? ` · ${dateText}` : ''}
            </Text>
          </>
        ) : (
          <Text className="text-base text-gray-900">No active subscription</Text>
        )}
      </Card>

      <View className="gap-2">
        <Button label="Manage Subscription" variant="tinted" size="large" onPress={handleManage} />
        {isAvailable ? (
          <Button
            label={isRestoring ? 'Restoring…' : 'Restore Purchases'}
            variant="plain"
            onPress={handleRestore}
            disabled={isRestoring}
          />
        ) : null}
      </View>

      <Text className="text-xs text-gray-500 leading-4">
        Your subscription is billed through your Apple ID. To change plans or cancel, use Manage
        Subscription — cancelling keeps Invoice Them Pro active until the end of the current period.
      </Text>
    </ScrollView>
  );
}
