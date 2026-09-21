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
    return <Text className="text-sm text-gray-500">No activity yet.</Text>;
  }
  return (
    <View>
      {entries.map((entry) => (
        <View key={entry.id} className="flex-row justify-between py-1.5">
          <Text className="text-sm text-gray-700">
            {LABELS[entry.event_type]}
            {entry.event_detail ? ` — ${entry.event_detail}` : ''}
          </Text>
          <Text className="text-xs text-gray-500">
            {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
      ))}
    </View>
  );
}
