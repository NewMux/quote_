import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../Icon';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Primary button and secondary links, kept below the fields. */
  actions: ReactNode;
}

/** Shared layout for sign-in, sign-up and password screens. Everything scrolls, so the keyboard never
 * hides the primary button and the layout survives the largest text sizes; content is width-limited
 * so it doesn't stretch on iPad. */
export function AuthScreen({ title, subtitle, children, actions }: AuthScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-grouped">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="w-full max-w-[440px] self-center gap-7">
          <View className="gap-2 items-center">
            {/* The app's mark, the way Apple's own sign-in screens lead with the product's icon. */}
            <View
              className="w-16 h-16 rounded-[18px] bg-brand items-center justify-center mb-3"
              style={{ borderCurve: 'continuous' }}
            >
              <Icon name="doc.text.fill" size={32} color="#FFFFFF" />
            </View>
            <Text className="text-largetitle font-bold text-label text-center" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text className="text-body text-secondary text-center">{subtitle}</Text> : null}
          </View>
          <View className="gap-4">{children}</View>
          <View className="gap-2">{actions}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A text link with a full 44pt touch target. */
export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="min-h-[44px] items-center justify-center px-2">
      <Text className="text-tint text-subhead font-medium text-center">{label}</Text>
    </Pressable>
  );
}
