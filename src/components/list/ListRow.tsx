import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, useThemeColors } from '../../lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Trailing detail text, e.g. the current value of a setting. */
  value?: string;
  icon?: IconName;
  /** Background of the rounded-square icon (iOS Settings style). Omit for a plain tinted glyph. */
  iconBackground?: string;
  onPress?: () => void;
  /** Defaults to a chevron when the row is pressable. */
  accessory?: 'chevron' | 'checkmark' | 'none';
  destructive?: boolean;
  /** Centered action row, like "Sign Out". */
  centered?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  switchDisabled?: boolean;
  /** Replaces the trailing accessory with custom content. */
  trailing?: ReactNode;
  accessibilityHint?: string;
  /** Set by ListSection; draws the hairline above every row but the first. */
  showSeparator?: boolean;
}

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  iconBackground,
  onPress,
  accessory,
  destructive,
  centered,
  switchValue,
  onSwitchChange,
  switchDisabled,
  trailing,
  accessibilityHint,
  showSeparator,
}: ListRowProps) {
  const colors = useThemeColors();
  const hasSwitch = onSwitchChange !== undefined;
  const resolvedAccessory = accessory ?? (onPress && !hasSwitch && !centered ? 'chevron' : 'none');
  const titleColor = destructive ? 'text-destructive' : centered ? 'text-tint' : 'text-label';
  // Separators start where the text starts, like iOS lists.
  const separatorInset = icon ? 60 : 16;

  const content = (pressed: boolean) => (
    <View className={pressed ? 'bg-fill' : ''}>
      {showSeparator ? (
        <View style={{ marginLeft: separatorInset, height: 0.5 }} className="bg-separator" />
      ) : null}
      <View className="flex-row items-center min-h-[44px] px-4 py-2.5 gap-3">
        {icon ? (
          iconBackground ? (
            <View style={{ backgroundColor: iconBackground }} className="w-[30px] h-[30px] rounded-[7px] items-center justify-center">
              <Ionicons name={icon} size={18} color="#FFFFFF" />
            </View>
          ) : (
            <View className="w-[30px] items-center">
              <Ionicons name={icon} size={22} color={destructive ? colors.destructive : colors.tint} />
            </View>
          )
        ) : null}
        <View className={`flex-1 ${centered ? 'items-center' : ''}`}>
          <Text className={`text-[17px] ${titleColor}`}>{title}</Text>
          {subtitle ? <Text className="text-sm text-secondary mt-0.5">{subtitle}</Text> : null}
        </View>
        {value ? (
          <Text className="text-[17px] text-secondary max-w-[55%] text-right" numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {trailing}
        {hasSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            disabled={switchDisabled}
            trackColor={{ true: BRAND.default }}
            accessibilityLabel={title}
          />
        ) : null}
        {resolvedAccessory === 'chevron' ? (
          <Ionicons name="chevron-forward" size={17} color={colors.chevron} />
        ) : null}
        {resolvedAccessory === 'checkmark' ? (
          <Ionicons name="checkmark" size={20} color={colors.tint} accessibilityElementsHidden />
        ) : null}
      </View>
    </View>
  );

  if (!onPress || hasSwitch) {
    return (
      <View accessible={!hasSwitch} accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}>
        {content(false)}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={resolvedAccessory === 'checkmark' ? { selected: true } : undefined}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
