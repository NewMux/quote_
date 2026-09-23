import { format, parseISO } from 'date-fns';
import type { RecurrenceFrequency } from '../types/models';

export const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function frequencyLabel(frequency: RecurrenceFrequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
}

/** Stored dates are plain YYYY-MM-DD; parseISO reads them as local midnight, so the displayed
 * day never shifts across a timezone boundary the way `new Date('YYYY-MM-DD')` (UTC) would. */
export function formatScheduleDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

export function describeSchedule(frequency: RecurrenceFrequency, nextRunDate: string): string {
  return `Repeats ${frequencyLabel(frequency).toLowerCase()} · next ${formatScheduleDate(nextRunDate)}`;
}
