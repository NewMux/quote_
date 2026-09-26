import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import SignatureView, { type SignatureViewRef } from 'react-native-signature-canvas';
import { Button } from './Button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  /** Called when "Done" is tapped before anything was drawn. */
  onEmpty: () => void;
}

/** A drawing surface for a signature. The canvas is deliberately white in both appearances — it's
 * the paper the signature is printed on. The hosting sheet triggers saving via the ref. */
export const SignaturePad = forwardRef<SignatureViewRef, SignaturePadProps>(function SignaturePad(
  { onSave, onEmpty },
  ref
) {
  return (
    <View className="flex-1 gap-2">
      <View
        className="flex-1 border border-field rounded-[26px] overflow-hidden"
        style={{ backgroundColor: '#FFFFFF' }}
        accessibilityLabel="Signature area. Draw your signature with your finger."
      >
        <SignatureView
          ref={ref}
          onOK={onSave}
          onEmpty={onEmpty}
          descriptionText=""
          trimWhitespace
          webStyle=".m-signature-pad--footer { display: none; margin: 0; }"
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-subhead text-secondary">Sign above with your finger.</Text>
        <Button
          label="Clear"
          variant="plain"
          onPress={() => (ref && typeof ref !== 'function' ? ref.current?.clearSignature() : undefined)}
        />
      </View>
    </View>
  );
});
