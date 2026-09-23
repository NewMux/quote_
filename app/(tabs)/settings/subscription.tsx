import { useState } from 'react';
import { Alert, Linking, ScrollView } from 'react-native';
import Purchases from 'react-native-purchases';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { formatDisplayDate } from '../../../src/lib/format';
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

  async function handleManage() {
    try {
      if (isAvailable) {
        await Purchases.showManageSubscriptions();
      } else {
        await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL);
      }
    } catch {
      await Linking.openURL(APPLE_MANAGE_SUBSCRIPTIONS_URL).catch(() => {});
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      const restored = await restore();
      Alert.alert(
        restored ? 'Purchases Restored' : 'Nothing to Restore',
        restored
          ? 'Your subscription is active on this account.'
          : 'No active subscription was found for the Apple Account signed in on this device.'
      );
    } catch (err) {
      Alert.alert('Couldn’t Restore Purchases', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
      {!isAvailable ? (
        <ListSection footer="Subscriptions aren't set up in this build, so every feature is unlocked.">
          <ListRow title="Plan" value="All Features" />
        </ListSection>
      ) : entitlement ? (
        <ListSection header="Invoice Them Pro">
          <ListRow title="Plan" value={planName(entitlement.productIdentifier)} />
          <ListRow title="Status" value={entitlement.periodType === 'TRIAL' ? 'Free Trial' : 'Active'} />
          {entitlement.expirationDate ? (
            <ListRow
              title={entitlement.willRenew ? 'Renews On' : 'Ends On'}
              value={formatDisplayDate(entitlement.expirationDate)}
            />
          ) : null}
        </ListSection>
      ) : (
        <ListSection>
          <ListRow title="Status" value="Not Subscribed" />
        </ListSection>
      )}

      <ListSection footer="Your subscription is billed through your Apple Account. To change plans or cancel, use Manage Subscription — if you cancel, Invoice Them Pro stays active until the end of the current period.">
        <ListRow title="Manage Subscription" onPress={handleManage} accessory="none" />
        {isAvailable ? (
          <ListRow
            title={isRestoring ? 'Restoring…' : 'Restore Purchases'}
            onPress={isRestoring ? undefined : handleRestore}
            accessory="none"
          />
        ) : null}
      </ListSection>
    </ScrollView>
  );
}
