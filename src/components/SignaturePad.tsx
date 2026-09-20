import { useRef } from 'react';
import { View } from 'react-native';
import SignatureView, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Button } from './Button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const ref = useRef<SignatureViewRef>(null);

  return (
    <View className="flex-1">
      <View className="flex-1 border border-gray-300 rounded-xl overflow-hidden bg-white">
        <SignatureView
          ref={ref}
          onOK={onSave}
          descriptionText=""
          webStyle=".m-signature-pad--footer { display: none; margin: 0; }"
        />
      </View>
      <View className="flex-row justify-between mt-4">
        <Button label="Clear" variant="tinted" onPress={() => ref.current?.clearSignature()} />
        <Button label="Save Signature" variant="filled" onPress={() => ref.current?.readSignature()} />
      </View>
    </View>
  );
}
