import { Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import type { ActivityLogEntry } from '../types/models';
import { t } from '../lib/i18n';
import { dateLocale, datePattern } from '../lib/i18n/dates';

const LABELS: Record<ActivityLogEntry['event_type'], string> = {
  created: 'Created',
  edited: 'Edited',
  issued: 'Issued',
  viewed_marked: t('Marked as viewed'),
  shared: 'Shared',
  emailed: 'Emailed',
  signed_merchant: t('You signed'),
  signed_client: t('Client signed'),
  settlement_logged: t('Payment logged'),
  status_changed: t('Status changed'),
  converted_to_invoice: t('Converted to invoice'),
  voided: 'Canceled',
};

interface ActivityLogListProps {
  entries: ActivityLogEntry[];
}

/** A document's history as a simple timeline: a dot and line joining each event, newest first. */
export function ActivityLogList({ entries }: ActivityLogListProps) {
  if (entries.length === 0) {
    return <Text className="text-subhead text-secondary">{t('No activity yet.')}</Text>;
  }
  return (
    <View>
      {entries.map((entry, index) => (
        <View key={entry.id} className="flex-row gap-3" accessible>
          <View className="items-center w-3 pt-1.5">
            <View className={`w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-tint' : 'bg-field'}`} />
            {index < entries.length - 1 ? <View className="flex-1 w-px bg-separator mt-1" /> : null}
          </View>
          <View className="flex-1 pb-4">
            <Text className="text-subhead text-label" numberOfLines={2}>
              {LABELS[entry.event_type]}
              {entry.event_detail ? ` — ${entry.event_detail}` : ''}
            </Text>
            <Text className="text-footnote text-secondary">
              {format(parseISO(entry.created_at), `${datePattern('MMM d, yyyy')} · h:mm a`, { locale: dateLocale() })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
