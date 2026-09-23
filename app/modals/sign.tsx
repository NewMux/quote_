import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import type { SignatureViewRef } from 'react-native-signature-canvas';
import { SheetHeader } from '../../src/components/SheetHeader';
import { SignaturePad } from '../../src/components/SignaturePad';
import { logActivity } from '../../src/db/repositories/activityLog.repo';
import { upsertSignature } from '../../src/db/repositories/signatures.repo';
import { newId } from '../../src/lib/id';
import { persistPickedFile } from '../../src/lib/fileStorage';
import type { SignerRole } from '../../src/types/models';

export default function SignModal() {
  const { documentId, role } = useLocalSearchParams<{ documentId: string; role: SignerRole }>();
  const padRef = useRef<SignatureViewRef>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(dataUrl: string) {
    setIsSaving(true);
    try {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const tmpFile = new File(Paths.cache, `${newId()}.png`);
      tmpFile.write(base64, { encoding: 'base64' });

      const persistedUri = await persistPickedFile(tmpFile.uri, 'signatures', `${newId()}.png`);
      await upsertSignature(documentId, role, persistedUri);
      await logActivity(documentId, role === 'merchant' ? 'signed_merchant' : 'signed_client');
      router.back();
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Couldn’t Save Signature', err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-grouped">
      <SheetHeader
        title={role === 'merchant' ? 'Your Signature' : "Client's Signature"}
        actionLabel="Done"
        onAction={() => padRef.current?.readSignature()}
        actionDisabled={isSaving}
      />
      <View className="flex-1 p-4 pb-8">
        <SignaturePad
          ref={padRef}
          onSave={handleSave}
          onEmpty={() => Alert.alert('Nothing to Save', 'Draw a signature in the box first.')}
        />
      </View>
    </View>
  );
}
