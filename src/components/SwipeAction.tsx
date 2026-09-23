import { Pressable, Text, View } from 'react-native';
import type { SymbolName } from '../lib/symbols';
import { Icon } from './Icon';

export const SWIPE_ACTION_WIDTH = 76;

interface SwipeActionProps {
  label: string;
  icon: SymbolName;
  color: string;
  onPress: () => void;
}

/** One revealed swipe button: a white SF Symbol and label on a solid system color, like Mail's.
 * Rows that use these also expose the same actions to VoiceOver via `accessibilityActions`, since
 * swipe gestures aren't reachable with a screen reader. */
export function SwipeAction({ label, icon, color, onPress }: SwipeActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: SWIPE_ACTION_WIDTH, backgroundColor: color }}
      className="items-center justify-center"
    >
      <View className="items-center gap-1">
        <Icon name={icon} size={20} color="#FFFFFF" weight="medium" />
        <Text className="text-white text-caption font-semibold" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
