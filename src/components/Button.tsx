import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';
type ButtonSize = 'large' | 'medium' | 'small';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner in place of the label and blocks presses, e.g. while saving. */
  loading?: boolean;
  accessibilityHint?: string;
}

const CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  filled: 'bg-brand',
  tinted: 'bg-brand/15',
  plain: '',
  destructive: 'bg-destructive/10',
};

const TEXT_CLASSES: Record<ButtonVariant, string> = {
  filled: 'text-white',
  tinted: 'text-tint',
  plain: 'text-tint',
  destructive: 'text-destructive',
};

// Every size keeps at least a 44pt touch target.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'py-3.5 px-6 rounded-2xl min-h-[52px]',
  medium: 'py-2.5 px-4 rounded-xl min-h-[44px]',
  small: 'py-2 px-3 rounded-lg min-h-[44px]',
};

const TEXT_SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'text-[17px] font-semibold',
  medium: 'text-[15px] font-semibold',
  small: 'text-[15px] font-medium',
};

export function Button({
  label,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled,
  loading,
  accessibilityHint,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = disabled || loading;

  function handlePressIn() {
    if (inactive) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  function handlePress() {
    if (inactive) return;
    if (variant === 'filled' || variant === 'destructive') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      hitSlop={4}
      style={{ opacity: disabled && !loading ? 0.4 : 1 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className={`${CONTAINER_CLASSES[variant]} ${SIZE_CLASSES[size]} items-center justify-center`}>
          {loading ? (
            <ActivityIndicator color={variant === 'filled' ? '#FFFFFF' : undefined} />
          ) : (
            <Text className={`${TEXT_CLASSES[variant]} ${TEXT_SIZE_CLASSES[size]} text-center`} numberOfLines={2}>
              {label}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
