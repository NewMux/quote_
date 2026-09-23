import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ListRow } from '../../../src/components/list/ListRow';
import { ListSection } from '../../../src/components/list/ListSection';
import { exportBackup } from '../../../src/lib/backup';
import { disableReminders, enableReminders, isRemindersEnabled } from '../../../src/lib/notifications';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';

/** iOS Settings-style icon backgrounds (white glyphs on system colors). */
const ICON_COLORS = {
  account: '#8E8E93',
  subscription: '#FF9500',
  business: '#007AFF',
  catalog: '#34C759',
  tax: '#5856D6',
  numbers: '#FF2D55',
  recurring: '#157A63',
  reminders: '#FF3B30',
  export: '#0A84FF',
  privacy: '#8E8E93',
} as const;

export default function SettingsScreen() {
  const profile = useBusinessProfileStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const email = useAuthStore((s) => s.session?.user.email);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isTogglingReminders, setIsTogglingReminders] = useState(false);

  useEffect(() => {
    isRemindersEnabled().then(setRemindersEnabled);
  }, []);

  async function handleToggleReminders(value: boolean) {
    setIsTogglingReminders(true);
    try {
      if (value) {
        const granted = await enableReminders();
        setRemindersEnabled(granted);
        if (!granted) {
          Alert.alert(
            'Notifications Are Off',
            'Turn on notifications for Invoice Them in the Settings app, then try again.',
            [{ text: 'Not Now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]
          );
        }
      } else {
        await disableReminders();
        setRemindersEnabled(false);
      }
    } catch (err) {
      Alert.alert('Couldn’t Update Reminders', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsTogglingReminders(false);
    }
  }

  async function handleExport() {
    try {
      await exportBackup(profile?.business_name ?? null);
    } catch (err) {
      Alert.alert('Couldn’t Export Data', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out?', 'You can sign back in anytime with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/sign-in');
          } catch (err) {
            Alert.alert('Couldn’t Sign Out', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-grouped"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingTop: 8 }}
    >
      <ListSection header="Account">
        {email ? (
          <ListRow icon="person" iconBackground={ICON_COLORS.account} title={email} subtitle="Signed In" />
        ) : null}
        <ListRow
          icon="star"
          iconBackground={ICON_COLORS.subscription}
          title="Subscription"
          onPress={() => router.push('/settings/subscription')}
        />
      </ListSection>

      <ListSection header="Business">
        <ListRow
          icon="business"
          iconBackground={ICON_COLORS.business}
          title="Business Profile"
          value={profile?.business_name || undefined}
          onPress={() => router.push('/settings/business-profile')}
        />
        <ListRow
          icon="pricetags"
          iconBackground={ICON_COLORS.catalog}
          title="Item Catalog"
          onPress={() => router.push('/settings/items')}
        />
        <ListRow
          icon="calculator"
          iconBackground={ICON_COLORS.tax}
          title="Tax Rates"
          onPress={() => router.push('/settings/tax-brackets')}
        />
        <ListRow
          icon="list"
          iconBackground={ICON_COLORS.numbers}
          title="Invoice & Estimate Numbers"
          onPress={() => router.push('/settings/numbering')}
        />
        <ListRow
          icon="repeat"
          iconBackground={ICON_COLORS.recurring}
          title="Recurring Invoices"
          onPress={() => router.push('/settings/recurring')}
        />
      </ListSection>

      <ListSection
        header="Notifications"
        footer="Get a notification on this device when an invoice becomes overdue."
      >
        <ListRow
          icon="notifications"
          iconBackground={ICON_COLORS.reminders}
          title="Overdue Reminders"
          switchValue={remindersEnabled}
          onSwitchChange={handleToggleReminders}
          switchDisabled={isTogglingReminders}
        />
      </ListSection>

      <ListSection
        header="Data"
        footer="Save a copy of your clients, invoices, and estimates to Files, email, or cloud storage."
      >
        <ListRow
          icon="share"
          iconBackground={ICON_COLORS.export}
          title="Export Data"
          onPress={handleExport}
          accessory="none"
        />
      </ListSection>

      <ListSection header="About">
        <ListRow
          icon="shield-checkmark"
          iconBackground={ICON_COLORS.privacy}
          title="Privacy Policy"
          onPress={() => router.push('/settings/privacy-policy')}
        />
      </ListSection>

      <ListSection>
        <ListRow title="Sign Out" onPress={handleSignOut} centered destructive />
      </ListSection>

      <ListSection footer="Deleting can't be undone.">
        <ListRow title="Delete All Data" onPress={() => router.push('/settings/delete-data')} destructive />
        <ListRow title="Delete Account" onPress={() => router.push('/settings/delete-account')} destructive />
      </ListSection>
    </ScrollView>
  );
}
