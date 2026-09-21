import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (isoDate: string) => void;
  placeholder?: string;
}

export function DateField({ label, value, onChange, placeholder = 'Select date' }: DateFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <View>
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
      >
        <Text className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}
        </Text>
      </Pressable>
      {show ? (
        <View className="border border-gray-200 rounded-xl mt-2 p-2 bg-white">
          <DateTimePicker
            value={value ? parseISO(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            onChange={(_event, date) => {
              setShow(false);
              if (date) onChange(date.toISOString().slice(0, 10));
            }}
            onDismiss={() => setShow(false)}
          />
        </View>
      ) : null}
    </View>
  );
}
