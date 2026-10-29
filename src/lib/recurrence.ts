import { format, parseISO } from 'date-fns';
import type { RecurrenceFrequency } from '../types/models';
import { t } from './i18n';
import { dateLocale, datePattern } from './i18n/dates';

export const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: t('Weekly') },
  { value: 'monthly', label: t('Monthly') },
  { value: 'quarterly', label: t('Quarterly') },
  { value: 'yearly', label: t('Yearly') },
];

export function frequencyLabel(frequency: RecurrenceFrequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
}

/** Stored dates are plain YYYY-MM-DD; parseISO reads them as local midnight, so the displayed
 * day never shifts across a timezone boundary the way `new Date('YYYY-MM-DD')` (UTC) would. */
export function formatScheduleDate(isoDate: string): string {
  return format(parseISO(isoDate), datePattern('MMM d, yyyy'), { locale: dateLocale() });
}

export function describeSchedule(frequency: RecurrenceFrequency, nextRunDate: string): string {
  return t('Repeats {frequency} · next {date}', {
    frequency: frequencyLabel(frequency).toLowerCase(),
    date: formatScheduleDate(nextRunDate),
  });
}
