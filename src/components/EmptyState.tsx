import { Text, View } from 'react-native';
import type { SymbolName } from '../lib/symbols';
import { useThemeColors } from '../lib/theme';
import { Button } from './Button';
import { Icon } from './Icon';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: SymbolName;
  actionLabel?: string;
  onAction?: () => void;
}

/** Centered placeholder for an empty list, laid out like iOS's ContentUnavailableView. Put it in a
 * list with `contentContainerStyle={{ flexGrow: 1 }}` so it can center vertically. */
export function EmptyState({ title, subtitle, icon, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-16 px-8 gap-2">
      {icon ? <Icon name={icon} size={48} color={colors.secondary} style={{ marginBottom: 8 }} /> : null}
      <Text className="text-title2 font-bold text-label text-center" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text className="text-body text-secondary text-center">{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-4">
          <Button label={actionLabel} onPress={onAction} variant="tinted" size="medium" />
        </View>
      ) : null}
    </View>
  );
}
