import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BRAND } from '../lib/theme';

type IconButtonVariant = 'tinted' | 'destructive' | 'plain';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
}

const CONTAINER_CLASSES: Record<IconButtonVariant, string> = {
  tinted: 'bg-brand/10',
  destructive: 'bg-red-50',
  plain: '',
};

const ICON_COLORS: Record<IconButtonVariant, string> = {
  tinted: BRAND.default,
  destructive: '#DC2626',
  plain: '#374151',
};

/** A 44x44pt circular icon-only control. Always pass a real accessibilityLabel — with no
 * visible text, that's the only thing a screen reader has to describe the action. */
export function IconButton({ icon, onPress, accessibilityLabel, variant = 'tinted' }: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
    if (variant === 'destructive') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className={`w-11 h-11 rounded-full items-center justify-center ${CONTAINER_CLASSES[variant]}`}
      >
        <Ionicons name={icon} size={20} color={ICON_COLORS[variant]} />
      </Animated.View>
    </Pressable>
  );
}
