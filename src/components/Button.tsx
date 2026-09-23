import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { SymbolName } from '../lib/symbols';
import { useThemeColors } from '../lib/theme';
import { Icon } from './Icon';

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
  /** Optional leading SF Symbol. */
  icon?: SymbolName;
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

// Capsules, like iOS 26's bordered-prominent and tinted buttons. Every size keeps at least a 44pt
// touch target.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'py-3.5 px-6 rounded-full min-h-[52px]',
  medium: 'py-2.5 px-5 rounded-full min-h-[44px]',
  small: 'py-2 px-4 rounded-full min-h-[44px]',
};

const TEXT_SIZE_CLASSES: Record<ButtonSize, string> = {
  large: 'text-body font-semibold',
  medium: 'text-subhead font-semibold',
  small: 'text-subhead font-medium',
};

export function Button({
  label,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled,
  loading,
  accessibilityHint,
  icon,
}: ButtonProps) {
  const colors = useThemeColors();
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
        <View
          className={`${CONTAINER_CLASSES[variant]} ${SIZE_CLASSES[size]} flex-row gap-2 items-center justify-center`}
          style={{ borderCurve: 'continuous' }}
        >
          {loading ? (
            <ActivityIndicator color={variant === 'filled' ? '#FFFFFF' : undefined} />
          ) : (
            <>
              {icon ? (
                <Icon
                  name={icon}
                  size={size === 'large' ? 19 : 17}
                  weight="semibold"
                  color={
                    variant === 'filled' ? '#FFFFFF' : variant === 'destructive' ? colors.destructive : colors.tint
                  }
                />
              ) : null}
                <Text className={`${TEXT_CLASSES[variant]} ${TEXT_SIZE_CLASSES[size]} text-center`} numberOfLines={2}>
                {label}
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
