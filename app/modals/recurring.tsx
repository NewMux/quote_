import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { DateField } from '../../src/components/DateField';
import { FormScrollView } from '../../src/components/form/FormScrollView';
import { ListRow } from '../../src/components/list/ListRow';
import { ListSection } from '../../src/components/list/ListSection';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SheetScreen } from '../../src/components/SheetScreen';
import { getScheduleForDocument, saveSchedule, stopSchedule } from '../../src/db/repositories/recurring.repo';
import { toStoredDate } from '../../src/lib/format';
import { FREQUENCY_OPTIONS } from '../../src/lib/recurrence';
import type { RecurrenceFrequency } from '../../src/types/models';

export default function RecurringModal() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startDate, setStartDate] = useState(toStoredDate(new Date()));
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
          created === 1 ? 'Draft Invoice Created' : `${created} Draft Invoices Created`,
          'Find them in Documents, ready for you to review and send.'
        );
      }
      router.back();
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Schedule', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleStop() {
    Alert.alert('Stop Repeating?', 'No new drafts will be created. Invoices already created stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop Repeating',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopSchedule(documentId);
            router.back();
          } catch (err) {
            Alert.alert('Couldn’t Stop Schedule', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }

  return (
    <SheetScreen
      header={
        <SheetHeader
          title={hasSchedule ? 'Edit Recurring' : 'Make Recurring'}
          actionLabel={hasSchedule ? 'Save' : 'Start'}
          onAction={handleSave}
          actionDisabled={isLoading || isSaving}
        />
      }
    >
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator accessibilityLabel="Loading" />
        </View>
      ) : (
        <FormScrollView>
          <View className="mb-6">
            <SegmentedControl
              values={FREQUENCY_OPTIONS.map((o) => o.label)}
              selectedIndex={FREQUENCY_OPTIONS.findIndex((o) => o.value === frequency)}
              onChange={(e) => setFrequency(FREQUENCY_OPTIONS[e.nativeEvent.selectedSegmentIndex].value)}
              accessibilityLabel="Repeats"
            />
          </View>

          <ListSection footer="A new draft copy of this invoice is created on each date. You review it and send it yourself — nothing goes to your client automatically.">
            <DateField
              label={hasSchedule ? 'Next Draft On' : 'First Draft On'}
              value={startDate}
              onChange={setStartDate}
            />
          </ListSection>

          {hasSchedule ? (
            <ListSection>
              <ListRow title="Stop Repeating" onPress={handleStop} destructive centered />
            </ListSection>
          ) : null}
        </FormScrollView>
      )}
    </SheetScreen>
  );
}
