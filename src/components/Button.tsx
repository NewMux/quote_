import { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';
type ButtonSize = 'large' | 'medium' | 'small';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

const CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  filled: 'bg-brand',
  tinted: 'bg-brand/10',
  plain: '',
  destructive: 'bg-red-50',
};

const TEXT_CLASSES: Record<ButtonVariant, string> = {
  filled: 'text-white',
  tinted: 'text-brand',
  plain: 'text-brand',
  destructive: 'text-red-600',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'py-4 px-6 rounded-2xl items-center justify-center min-h-[44px]',
  medium: 'py-2.5 px-4 rounded-xl items-center justify-center min-h-[44px]',
  small: 'py-1 px-2 rounded-lg items-center justify-center min-h-[32px]',
};

const TEXT_SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'text-base font-semibold',
  medium: 'text-sm font-medium',
  small: 'text-xs font-medium',
};

export function Button({ label, onPress, variant = 'filled', size = 'medium', disabled }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
    if (variant === 'filled' || variant === 'destructive') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={8}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className={`${CONTAINER_CLASSES[variant]} ${SIZE_CLASSES[size]}`}>
          <Text className={`${TEXT_CLASSES[variant]} ${TEXT_SIZE_CLASSES[size]}`}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
