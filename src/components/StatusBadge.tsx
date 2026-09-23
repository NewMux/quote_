import { Text, View } from 'react-native';
import { getDisplayStatus, statusLabel } from '../lib/statusMachine';
import { useStatusColors } from '../lib/theme';
import type { DocumentListItem, DocumentRecord } from '../types/models';

interface StatusBadgeProps {
  document: Pick<DocumentRecord | DocumentListItem, 'status' | 'due_date' | 'total_minor' | 'amount_paid_minor'>;
}

export function StatusBadge({ document }: StatusBadgeProps) {
  const status = getDisplayStatus(document);
  const colors = useStatusColors()[status];
  return (
    <View style={{ backgroundColor: colors.bg }} className="rounded-full px-3 py-1 self-start">
      <Text style={{ color: colors.fg }} className="text-xs font-semibold">
        {statusLabel(status)}
      </Text>
    </View>
  );
}
