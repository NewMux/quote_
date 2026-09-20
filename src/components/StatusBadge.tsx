import { Text, View } from 'react-native';
import { getDisplayStatus, statusLabel, type DisplayStatus } from '../lib/statusMachine';
import type { DocumentListItem, DocumentRecord } from '../types/models';

const COLORS: Record<DisplayStatus, { bg: string; fg: string }> = {
  draft: { bg: '#F3F4F6', fg: '#374151' },
  issued: { bg: '#DBEAFE', fg: '#1D4ED8' },
  partially_paid: { bg: '#FEF3C7', fg: '#B45309' },
  paid: { bg: '#D1FAE5', fg: '#047857' },
  overdue: { bg: '#FEE2E2', fg: '#B91C1C' },
  void: { bg: '#E5E7EB', fg: '#6B7280' },
};

interface StatusBadgeProps {
  document: Pick<DocumentRecord | DocumentListItem, 'status' | 'due_date' | 'total_minor' | 'amount_paid_minor'>;
}

export function StatusBadge({ document }: StatusBadgeProps) {
  const status = getDisplayStatus(document);
  const colors = COLORS[status];
  return (
    <View style={{ backgroundColor: colors.bg }} className="rounded-full px-3 py-1 self-start">
      <Text style={{ color: colors.fg }} className="text-xs font-semibold">
        {statusLabel(status)}
      </Text>
    </View>
  );
}
