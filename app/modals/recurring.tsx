import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { format } from 'date-fns';
import { Button } from '../../src/components/Button';
import { DateField } from '../../src/components/DateField';
import { SheetHeader } from '../../src/components/SheetHeader';
import { getScheduleForDocument, saveSchedule, stopSchedule } from '../../src/db/repositories/recurring.repo';
import { FREQUENCY_OPTIONS, frequencyLabel } from '../../src/lib/recurrence';
import { BRAND } from '../../src/lib/theme';
import type { RecurrenceFrequency } from '../../src/types/models';

export default function RecurringModal() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hasSchedule, setHasSchedule] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getScheduleForDocument(documentId)
      .then((schedule) => {
        if (schedule) {
          setFrequency(schedule.frequency);
          setStartDate(schedule.next_run_date);
          setHasSchedule(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [documentId]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const created = await saveSchedule(documentId, frequency, startDate);
      if (created > 0) {
        Alert.alert(
          created === 1 ? 'Draft invoice created' : `${created} draft invoices created`,
          'Find them in Documents, ready for you to review and send.'
        );
      }
      router.back();
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Could not save schedule', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleStop() {
    Alert.alert('Stop repeating?', 'No new drafts will be created. Invoices already created stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop Repeating',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopSchedule(documentId);
            router.back();
          } catch (err) {
            Alert.alert('Could not stop schedule', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title={hasSchedule ? 'Edit Recurring' : 'Make Recurring'} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="p-4 gap-5">
          <Text className="text-sm text-gray-600 leading-5">
            A new draft copy of this invoice is created on each date. You review it and send it
            yourself — nothing goes to your client automatically.
          </Text>

          <View>
            <Text className="text-xs text-gray-500 mb-2">Repeats</Text>
            <SegmentedControl
              values={FREQUENCY_OPTIONS.map((o) => o.label)}
              selectedIndex={FREQUENCY_OPTIONS.findIndex((o) => o.value === frequency)}
              tintColor={BRAND.default}
              onChange={(e) => setFrequency(FREQUENCY_OPTIONS[e.nativeEvent.selectedSegmentIndex].value)}
            />
          </View>

          <DateField
            label={hasSchedule ? 'Next Draft On' : 'First Draft On'}
            value={startDate}
            onChange={setStartDate}
          />

          <Button
            label={isSaving ? 'Saving…' : `Repeat ${frequencyLabel(frequency)}`}
            variant="filled"
            size="large"
            disabled={isSaving}
            onPress={handleSave}
          />
          {hasSchedule ? (
            <Button label="Stop Repeating" variant="destructive" size="large" onPress={handleStop} />
          ) : null}
        </View>
      )}
    </View>
  );
}
