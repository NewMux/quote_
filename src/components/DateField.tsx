import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
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
      <Text className="text-xs text-secondary mb-1">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="border border-field rounded-lg px-3 py-2 bg-card"
      >
        <Text className={value ? 'text-label' : 'text-secondary'}>
          {value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}
        </Text>
      </Pressable>
      {show && Platform.OS === 'ios' ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable
            className="flex-1 items-center justify-center bg-black/40 px-6"
            onPress={() => setShow(false)}
          >
            <View className="bg-card rounded-2xl p-2" style={{ width: 320 }}>
              <DateTimePicker
                value={value ? parseISO(value) : new Date()}
                mode="date"
                display="inline"
                style={{ width: 320 }}
                onChange={(_event, date) => {
                  setShow(false);
                  if (date) onChange(date.toISOString().slice(0, 10));
                }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}
      {show && Platform.OS !== 'ios' ? (
        <DateTimePicker
          value={value ? parseISO(value) : new Date()}
          mode="date"
          display="calendar"
          onChange={(_event, date) => {
            setShow(false);
            if (date) onChange(date.toISOString().slice(0, 10));
          }}
          onDismiss={() => setShow(false)}
        />
      ) : null}
    </View>
  );
}
