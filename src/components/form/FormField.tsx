import { forwardRef, useId } from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '../../lib/theme';

export interface FormFieldProps extends TextInputProps {
  label: string;
  /** Helper text under the field — stays visible while typing, unlike a placeholder. */
  hint?: string;
  error?: string | null;
  /** Rendered inside the field before the text, e.g. a currency symbol. */
  prefix?: string;
}

/** A labeled text field: 44pt+ tall, 17pt text, and its visible label doubles as the VoiceOver
 * label so the two can never disagree. */
export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, hint, error, prefix, multiline, style, ...inputProps },
  ref
) {
  const colors = useThemeColors();
  const accessoryId = `keyboard-done-${useId()}`;
  // Number and phone pads have no Return key, so iOS gets a "Done" bar above them.
  const needsDoneBar =
    Platform.OS === 'ios' &&
    (inputProps.keyboardType === 'decimal-pad' ||
      inputProps.keyboardType === 'number-pad' ||
      inputProps.keyboardType === 'phone-pad');
  return (
    <View>
      <Text className="text-sm text-secondary mb-1.5">{label}</Text>
      <View
        className={`flex-row items-center bg-card rounded-xl border px-3 ${
          error ? 'border-destructive' : 'border-field'
        }`}
      >
        {prefix ? <Text className="text-[17px] text-secondary mr-1">{prefix}</Text> : null}
        <TextInput
          ref={ref}
          className="flex-1 text-[17px] text-label py-2.5"
          style={[{ minHeight: multiline ? 88 : 44, textAlignVertical: multiline ? 'top' : 'center' }, style]}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          inputAccessoryViewID={needsDoneBar ? accessoryId : undefined}
          {...inputProps}
        />
      </View>
      {needsDoneBar ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View className="flex-row justify-end bg-elevated border-t border-separator px-4">
            <Pressable
              onPress={() => Keyboard.dismiss()}
              accessibilityRole="button"
              className="min-h-[44px] justify-center px-2"
            >
              <Text className="text-[17px] font-semibold text-tint">Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
      {error ? (
        <Text className="text-sm text-destructive mt-1.5">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-secondary mt-1.5">{hint}</Text>
      ) : null}
    </View>
  );
});
