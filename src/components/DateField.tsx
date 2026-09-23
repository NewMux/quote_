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
}

/** A labeled date row. iOS uses the system compact date picker (a date button that opens the
 * calendar popover); Android opens the system date dialog. Dates are saved as the local calendar
 * day, so the day picked is the day stored in every timezone. */
export function DateField({ label, value, onChange, emptyLabel = 'Add Date' }: DateFieldProps) {
  const colors = useThemeColors();
  const [showAndroidDialog, setShowAndroidDialog] = useState(false);

  const trailing = !value ? (
    <Pressable
      onPress={() => onChange(toStoredDate(new Date()))}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${emptyLabel}`}
      className="min-h-[44px] justify-center"
    >
      <Text className="text-[17px] text-tint">{emptyLabel}</Text>
    </Pressable>
  ) : Platform.OS === 'ios' ? (
    <DateTimePicker
      value={parseISO(value)}
      mode="date"
      display="compact"
      accentColor={colors.tint}
      accessibilityLabel={label}
      onChange={(_event, date) => {
        if (date) onChange(toStoredDate(date));
      }}
    />
  ) : (
    <Pressable
      onPress={() => setShowAndroidDialog(true)}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatDisplayDate(value)}`}
      className="min-h-[44px] justify-center"
    >
      <Text className="text-[17px] text-tint">{formatDisplayDate(value)}</Text>
    </Pressable>
  );

  return (
    <View className="flex-row items-center justify-between gap-3 bg-card rounded-xl border border-field pl-3 pr-2 min-h-[50px]">
      <Text className="text-[17px] text-label flex-shrink">{label}</Text>
      {trailing}
      {showAndroidDialog && value ? (
        <DateTimePicker
          value={parseISO(value)}
          mode="date"
          display="calendar"
          onChange={(_event, date) => {
            setShowAndroidDialog(false);
            if (date) onChange(toStoredDate(date));
          }}
        />
      ) : null}
    </View>
  );
}
