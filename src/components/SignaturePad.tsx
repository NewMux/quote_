import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import SignatureView, { type SignatureViewRef } from 'react-native-signature-canvas';

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
        <Pressable
          className="px-4 py-3 rounded-lg border border-gray-300"
          onPress={() => ref.current?.clearSignature()}
        >
          <Text className="text-gray-700 font-medium">Clear</Text>
        </Pressable>
        <Pressable
          className="px-6 py-3 rounded-lg bg-brand"
          onPress={() => ref.current?.readSignature()}
        >
          <Text className="text-white font-semibold">Save Signature</Text>
        </Pressable>
      </View>
    </View>
  );
}
