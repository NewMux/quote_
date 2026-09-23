import { Text, View } from 'react-native';
import { Icon } from './Icon';
import { useThemeColors } from '../lib/theme';
import type { DocumentRecord } from '../types/models';

const INVOICE_STAGES = ['Draft', 'Issued', 'Paid'];
const ESTIMATE_STAGES = ['Draft', 'Issued', 'Converted'];

function currentStageIndex(document: DocumentRecord): number {
  if (document.doc_type === 'estimate') {
    if (document.converted_to_document_id) return 2;
    if (document.status !== 'draft') return 1;
    return 0;
  }
  if (document.status === 'paid') return 2;
  if (document.status !== 'draft') return 1;
  return 0;
}

/** Gives the contextual primary CTA (Issue -> Convert/Log Payment -> Email) a visible "why" —
 * hidden for void documents since the status badge already explains that case. */
export function DocumentStageIndicator({ document }: { document: DocumentRecord }) {
  const colors = useThemeColors();
  if (document.status === 'void') return null;
  const stages = document.doc_type === 'estimate' ? ESTIMATE_STAGES : INVOICE_STAGES;
  const current = currentStageIndex(document);

  return (
    <View
      className="flex-row items-center"
      accessible
      accessibilityLabel={`Stage ${current + 1} of ${stages.length}: ${stages[current]}`}
    >
      {stages.map((stage, index) => (
        <View key={stage} className="flex-row items-center">
          <Text
            className={`text-subhead ${index <= current ? 'text-tint font-semibold' : 'text-secondary'}`}
          >
            {stage}
          </Text>
          {index < stages.length - 1 ? (
            <Icon
              name="chevron.right"
              size={11}
              weight="semibold"
              color={index < current ? colors.tint : colors.chevron}
              style={{ marginHorizontal: 4 }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
