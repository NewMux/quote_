import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SWIPE_ACTION_WIDTH = 76;

interface SwipeActionProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export function SwipeAction({ label, icon, color, onPress }: SwipeActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{ width: SWIPE_ACTION_WIDTH, backgroundColor: color }}
      className="items-center justify-center gap-1"
    >
      <Ionicons name={icon} size={20} color="white" />
      <Text className="text-white text-xs font-medium">{label}</Text>
    </Pressable>
  );
}
