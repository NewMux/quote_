import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseISO } from 'date-fns';
import { formatDisplayDate, toStoredDate } from '../lib/format';
import { useThemeColors } from '../lib/theme';

interface DateFieldProps {
  label: string;
  /** Stored YYYY-MM-DD, or null when no date is set yet. */
  value: string | null;
  onChange: (isoDate: string) => void;
  /** Shown instead of a date when `value` is null (tapping it picks today). */
  emptyLabel?: string;
  /** Set by ListSection; draws the hairline above every row but the first. */
  showSeparator?: boolean;
}

/** A date row for a grouped form (put it in a ListSection). iOS uses the system compact date picker (a date button that opens the
 * calendar popover); Android opens the system date dialog. Dates are saved as the local calendar
 * day, so the day picked is the day stored in every timezone. */
export function DateField({ label, value, onChange, emptyLabel = 'Add Date', showSeparator }: DateFieldProps) {
  const colors = useThemeColors();
  const [showAndroidDialog, setShowAndroidDialog] = useState(false);

  const trailing = !value ? (
    <Pressable
      onPress={() => onChange(toStoredDate(new Date()))}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${emptyLabel}`}
      className="min-h-[44px] justify-center"
    >
      <Text className="text-body text-tint">{emptyLabel}</Text>
    </Pressable>
  ) : Platform.OS === 'ios' ? (
    <DateTimePicker
      value={parseISO(value)}
      mode="date"
      display="compact"
      accentColor={colors.tint}
      accessibilityLabel={label}
      onValueChange={(_event, date) => onChange(toStoredDate(date))}
    />
  ) : (
    <Pressable
      onPress={() => setShowAndroidDialog(true)}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatDisplayDate(value)}`}
      className="min-h-[44px] justify-center"
    >
      <Text className="text-body text-tint">{formatDisplayDate(value)}</Text>
    </Pressable>
  );

  return (
    <View>
      {showSeparator ? <View style={{ marginLeft: 16, height: 0.5 }} className="bg-separator" /> : null}
      <View className="flex-row items-center justify-between gap-3 pl-4 pr-3 min-h-[50px]">
        <Text className="text-body text-label flex-shrink">{label}</Text>
        {trailing}
      </View>
      {showAndroidDialog && value ? (
        <DateTimePicker
          value={parseISO(value)}
          mode="date"
          display="calendar"
          onValueChange={(_event, date) => {
            setShowAndroidDialog(false);
            onChange(toStoredDate(date));
          }}
          onDismiss={() => setShowAndroidDialog(false)}
        />
      ) : null}
    </View>
  );
}
