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

/** A standalone labeled text field (sign-in, onboarding, confirmations): a borderless grouped card
 * 50pt tall with 17pt text, whose visible label doubles as the VoiceOver label. Grouped forms use
 * FormRow instead. */
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
      <Text className="text-footnote text-secondary px-4 mb-1.5">{label}</Text>
      <View
        className={`flex-row items-center bg-card rounded-[14px] border px-4 ${
          error ? 'border-destructive' : 'border-transparent'
        }`}
        style={{ borderCurve: 'continuous' }}
      >
        {prefix ? <Text className="text-body text-secondary mr-1">{prefix}</Text> : null}
        <TextInput
          ref={ref}
          className="flex-1 text-body text-label py-2.5"
          style={[{ minHeight: multiline ? 88 : 50, textAlignVertical: multiline ? 'top' : 'center' }, style]}
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
              <Text className="text-body font-semibold text-tint">Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
      {error ? (
        <Text className="text-footnote text-destructive px-4 mt-1.5">{error}</Text>
      ) : hint ? (
        <Text className="text-footnote text-secondary px-4 mt-1.5">{hint}</Text>
      ) : null}
    </View>
  );
});
