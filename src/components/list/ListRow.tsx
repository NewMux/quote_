import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Icon } from '../Icon';
import type { SymbolName } from '../../lib/symbols';
import { BRAND, useThemeColors } from '../../lib/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Trailing detail text, e.g. the current value of a setting. */
  value?: string;
  /** Tailwind classes for the trailing value, e.g. to color an amount. */
  valueClassName?: string;
  icon?: SymbolName;
  /** Background of the rounded-square icon (iOS Settings style). Omit for a plain tinted glyph. */
  iconBackground?: string;
  /** Color of a plain (no background) glyph. Defaults to the tint color. */
  iconColor?: string;
  /** Custom leading content (e.g. an avatar) in place of an icon. */
  leading?: ReactNode;
  /** Where the separator above this row starts, when `leading` is wider than an icon. */
  separatorInset?: number;
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

/** One row of an inset-grouped list, laid out like iOS Settings: optional icon, title and subtitle,
 * trailing value, and a chevron, checkmark, or switch. */
export function ListRow({
  title,
  subtitle,
  value,
  valueClassName,
  icon,
  iconBackground,
  iconColor,
  leading,
  separatorInset,
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
  const inset = separatorInset ?? (icon ? 58 : 16);

  const content = (pressed: boolean) => (
    <View className={pressed ? 'bg-fill' : ''}>
      {showSeparator ? <View style={{ marginLeft: inset, height: 0.5 }} className="bg-separator" /> : null}
      <View className="flex-row items-center min-h-[50px] px-4 py-2.5 gap-3">
        {leading}
        {!leading && icon ? (
          iconBackground ? (
            <View
              style={{ backgroundColor: iconBackground, borderCurve: 'continuous' }}
              className="w-[30px] h-[30px] rounded-[8px] items-center justify-center"
            >
              <Icon name={icon} size={17} color="#FFFFFF" weight="medium" />
            </View>
          ) : (
            <View className="w-[30px] items-center">
              <Icon name={icon} size={21} color={iconColor ?? (destructive ? colors.destructive : colors.tint)} />
            </View>
          )
        ) : null}
        <View className={`flex-1 ${centered ? 'items-center' : ''}`}>
          <Text className={`text-body ${titleColor}`}>{title}</Text>
          {subtitle ? <Text className="text-subhead text-secondary mt-0.5">{subtitle}</Text> : null}
        </View>
        {value ? (
          <Text className={`text-body max-w-[55%] text-right ${valueClassName ?? 'text-secondary'}`} numberOfLines={1}>
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
          <Icon name="chevron.right" size={14} weight="semibold" color={colors.chevron} />
        ) : null}
        {resolvedAccessory === 'checkmark' ? (
          <Icon name="checkmark" size={17} weight="semibold" color={colors.tint} />
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
