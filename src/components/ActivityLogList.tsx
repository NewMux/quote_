import { Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import type { ActivityLogEntry } from '../types/models';

const LABELS: Record<ActivityLogEntry['event_type'], string> = {
  created: 'Created',
  edited: 'Edited',
  issued: 'Issued',
  viewed_marked: 'Marked as viewed',
  shared: 'Shared',
  emailed: 'Emailed',
  signed_merchant: 'You signed',
  signed_client: 'Client signed',
  settlement_logged: 'Payment logged',
  status_changed: 'Status changed',
  converted_to_invoice: 'Converted to invoice',
  voided: 'Canceled',
};

interface ActivityLogListProps {
  entries: ActivityLogEntry[];
}

export function ActivityLogList({ entries }: ActivityLogListProps) {
  if (entries.length === 0) {
    return <Text className="text-subhead text-secondary">No activity yet.</Text>;
  }
  return (
    <View>
      {entries.map((entry) => (
        <View key={entry.id} className="flex-row justify-between py-1.5">
          <View className="flex-1 pr-2">
            <Text className="text-subhead text-label" numberOfLines={2}>
              {LABELS[entry.event_type]}
              {entry.event_detail ? ` — ${entry.event_detail}` : ''}
            </Text>
          </View>
          <Text className="text-subhead text-secondary flex-shrink-0">
            {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
      ))}
    </View>
  );
}
