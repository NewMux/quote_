import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../../../src/components/Avatar';
import { Icon } from '../../../src/components/Icon';
import { ListRow } from '../../../src/components/list/ListRow';
import { GROUPED_RADIUS, ListSection } from '../../../src/components/list/ListSection';
import { exportBackup } from '../../../src/lib/backup';
import { useSignedUrl } from '../../../src/lib/useSignedUrl';
import { disableReminders, enableReminders, isRemindersEnabled } from '../../../src/lib/notifications';
import { useThemeColors } from '../../../src/lib/theme';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useBusinessProfileStore } from '../../../src/stores/useBusinessProfileStore';
import { t } from '../../../src/lib/i18n';

/** iOS Settings-style icon backgrounds (white glyphs on system colors). */
const ICON_COLORS = {
  subscription: '#FF9500',
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
  const colors = useThemeColors();
  const businessName = profile?.business_name?.trim() || t('Your Business');
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
            t('Notifications Are Off'),
            t('Turn on notifications for Invoice Them in the Settings app, then try again.'),
            [{ text: t('Not Now'), style: 'cancel' }, { text: t('Open Settings'), onPress: () => Linking.openSettings() }]
          );
        }
      } else {
        await disableReminders();
        setRemindersEnabled(false);
      }
    } catch (err) {
      Alert.alert(t('Couldn’t Update Reminders'), err instanceof Error ? err.message : t('Something went wrong.'));
    } finally {
      setIsTogglingReminders(false);
    }
  }

  async function handleExport() {
    try {
      await exportBackup(profile?.business_name ?? null);
    } catch (err) {
      Alert.alert(t('Couldn’t Export Data'), err instanceof Error ? err.message : t('Something went wrong.'));
    }
  }

  function handleSignOut() {
    Alert.alert(t('Sign Out?'), t('You can sign back in anytime with your email and password.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Sign Out'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/sign-in');
          } catch (err) {
            Alert.alert(t('Couldn’t Sign Out'), err instanceof Error ? err.message : t('Something went wrong.'));
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
      {/* Apple Account-style header: the business this app is set up for, and who's signed in. */}
      <View className="mb-8">
        <Pressable
          onPress={() => router.push('/settings/business-profile')}
          accessibilityRole="button"
          accessibilityLabel={`${businessName}, ${email ?? t('Business Profile')}`}
          accessibilityHint={t('Edit your business profile')}
        >
          {({ pressed }) => (
            <View
              className={`flex-row items-center gap-4 px-4 py-3 ${pressed ? 'bg-fill' : 'bg-card'}`}
              style={{ borderRadius: GROUPED_RADIUS, borderCurve: 'continuous' }}
            >
              <BusinessMark name={businessName} logoPath={profile?.logo_uri} />
              <View className="flex-1">
                <Text className="text-title3 font-semibold text-label" numberOfLines={1}>
                  {businessName}
                </Text>
                <Text className="text-subhead text-secondary" numberOfLines={1}>
                  {email ? `${email} · ${t('Business Profile')}` : t('Business Profile')}
                </Text>
              </View>
              <Icon name="chevron.right" size={14} weight="semibold" color={colors.chevron} />
            </View>
          )}
        </Pressable>
      </View>

      <ListSection>
        <ListRow
          icon="crown.fill"
          iconBackground={ICON_COLORS.subscription}
          title={t('Invoice Them Pro')}
          onPress={() => router.push('/settings/subscription')}
        />
      </ListSection>

      <ListSection header={t('Business')}>
        <ListRow
          icon="tag.fill"
          iconBackground={ICON_COLORS.catalog}
          title={t('Item Catalog')}
          onPress={() => router.push('/settings/items')}
        />
        <ListRow
          icon="percent"
          iconBackground={ICON_COLORS.tax}
          title={t('Tax Rates')}
          onPress={() => router.push('/settings/tax-brackets')}
        />
        <ListRow
          icon="number"
          iconBackground={ICON_COLORS.numbers}
          title={t('Invoice & Estimate Numbers')}
          onPress={() => router.push('/settings/numbering')}
        />
        <ListRow
          icon="repeat"
          iconBackground={ICON_COLORS.recurring}
          title={t('Recurring Invoices')}
          onPress={() => router.push('/settings/recurring')}
        />
      </ListSection>

      <ListSection
        header={t('Notifications')}
        footer={t('Get a notification on this device when an invoice becomes overdue.')}
      >
        <ListRow
          icon="bell.fill"
          iconBackground={ICON_COLORS.reminders}
          title={t('Overdue Reminders')}
          switchValue={remindersEnabled}
          onSwitchChange={handleToggleReminders}
          switchDisabled={isTogglingReminders}
        />
      </ListSection>

      <ListSection
        header={t('Data')}
        footer={t('Save a copy of your clients, invoices, and estimates to Files, email, or cloud storage.')}
      >
        <ListRow
          icon="square.and.arrow.up"
          iconBackground={ICON_COLORS.export}
          title={t('Export Data')}
          onPress={handleExport}
          accessory="none"
        />
      </ListSection>

      <ListSection header={t('About')}>
        <ListRow
          icon="hand.raised.fill"
          iconBackground={ICON_COLORS.privacy}
          title={t('Privacy Policy')}
          onPress={() => router.push('/settings/privacy-policy')}
        />
      </ListSection>

      <ListSection>
        <ListRow title={t('Sign Out')} onPress={handleSignOut} centered destructive />
      </ListSection>

      <ListSection footer={t("Deleting can't be undone.")}>
        <ListRow title={t('Delete All Data')} onPress={() => router.push('/settings/delete-data')} destructive />
        <ListRow title={t('Delete Account')} onPress={() => router.push('/settings/delete-account')} destructive />
      </ListSection>
    </ScrollView>
  );
}

/** The business's logo, uncropped in a rounded square (logos are rarely circular); initials when
 * there's no logo yet. */
function BusinessMark({ name, logoPath }: { name: string; logoPath: string | null | undefined }) {
  const logoUrl = useSignedUrl(logoPath);
  if (!logoUrl) return <Avatar name={name} seed={name} size={60} />;
  return (
    <View className="w-[60px] h-[60px] rounded-2xl bg-white overflow-hidden" style={{ borderCurve: 'continuous' }}>
      <Image source={{ uri: logoUrl }} className="w-[60px] h-[60px]" resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}
