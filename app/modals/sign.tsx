import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SignaturePad } from '../../src/components/SignaturePad';
import { logActivity } from '../../src/db/repositories/activityLog.repo';
import { upsertSignature } from '../../src/db/repositories/signatures.repo';
import { newId } from '../../src/lib/id';
import { persistPickedFile } from '../../src/lib/fileStorage';
import type { SignerRole } from '../../src/types/models';

export default function SignModal() {
  const { documentId, role } = useLocalSearchParams<{ documentId: string; role: SignerRole }>();

  async function handleSave(dataUrl: string) {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const tmpFile = new File(Paths.cache, `${newId()}.png`);
    tmpFile.write(base64, { encoding: 'base64' });

    const persistedUri = await persistPickedFile(tmpFile.uri, 'signatures', `${newId()}.png`);
    await upsertSignature(documentId, role, persistedUri);
    await logActivity(documentId, role === 'merchant' ? 'signed_merchant' : 'signed_client');
    router.back();
  }

  return (
    <View className="flex-1 bg-surface">
      <SheetHeader title="Signature" />
      <View className="flex-1 p-4">
        <SignaturePad onSave={handleSave} />
      </View>
    </View>
  );
}
