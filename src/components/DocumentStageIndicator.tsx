import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../lib/theme';
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
  if (document.status === 'void') return null;
  const stages = document.doc_type === 'estimate' ? ESTIMATE_STAGES : INVOICE_STAGES;
  const current = currentStageIndex(document);

  return (
    <View className="flex-row items-center">
      {stages.map((stage, index) => (
        <View key={stage} className="flex-row items-center">
          <Text
            className={`text-xs ${index <= current ? 'text-brand font-semibold' : 'text-gray-500'}`}
          >
            {stage}
          </Text>
          {index < stages.length - 1 ? (
            <Ionicons
              name="chevron-forward"
              size={12}
              color={index < current ? BRAND.default : '#D1D5DB'}
              style={{ marginHorizontal: 4 }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
