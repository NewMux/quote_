import { Pressable, Text } from 'react-native';

interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Bold, for the confirming action (Save, Add, Done). */
  prominent?: boolean;
}

/** A 44pt text button for navigation bars and sheet headers. */
export function HeaderTextButton({ label, onPress, disabled, prominent }: HeaderTextButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      className="min-h-[44px] min-w-[44px] justify-center px-1"
    >
      <Text
        className={`text-body ${prominent ? 'font-semibold' : ''} ${disabled ? 'text-placeholder' : 'text-tint'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
