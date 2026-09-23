import { Text, View } from 'react-native';
import { getDisplayStatus, statusLabel, type DisplayStatus } from '../lib/statusMachine';
import type { SymbolName } from '../lib/symbols';
import { useStatusColors } from '../lib/theme';
import type { DocumentListItem, DocumentRecord } from '../types/models';
import { Icon } from './Icon';

const STATUS_SYMBOLS: Record<DisplayStatus, SymbolName> = {
  draft: 'pencil.circle.fill',
  issued: 'paperplane.fill',
  partially_paid: 'circle.lefthalf.filled',
  paid: 'checkmark.circle.fill',
  overdue: 'exclamationmark.circle.fill',
  void: 'xmark.circle.fill',
};

interface StatusBadgeProps {
  document: Pick<DocumentRecord | DocumentListItem, 'status' | 'due_date' | 'total_minor' | 'amount_paid_minor'>;
  /** `pill`: a tinted capsule (detail headers). `inline`: a glyph and colored text (list rows). */
  variant?: 'pill' | 'inline';
}

/** A document's status as an SF Symbol plus its name — the text always states the status, so the
 * meaning never rests on color alone. */
export function StatusBadge({ document, variant = 'pill' }: StatusBadgeProps) {
  const status = getDisplayStatus(document);
  const colors = useStatusColors()[status];
  const symbol = STATUS_SYMBOLS[status];

  if (variant === 'inline') {
    return (
      <View className="flex-row items-center gap-1">
        <Icon name={symbol} size={13} color={colors.fg} />
        <Text style={{ color: colors.fg }} className="text-footnote font-semibold">
          {statusLabel(status)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 self-start">
      <Icon name={symbol} size={14} color={colors.fg} />
      <Text style={{ color: colors.fg }} className="text-subhead font-semibold">
        {statusLabel(status)}
      </Text>
    </View>
  );
}
