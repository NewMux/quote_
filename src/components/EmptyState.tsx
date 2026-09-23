import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../lib/theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

/** Centered placeholder for an empty list. Put it in a list with `contentContainerStyle={{
 * flexGrow: 1 }}` so it can center vertically. */
export function EmptyState({ title, subtitle, icon, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-16 px-8 gap-2">
      {icon ? <Ionicons name={icon} size={44} color={colors.secondary} style={{ marginBottom: 4 }} /> : null}
      <Text className="text-xl font-semibold text-label text-center" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text className="text-base text-secondary text-center">{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-3">
          <Button label={actionLabel} onPress={onAction} variant="tinted" />
        </View>
      ) : null}
    </View>
  );
}
