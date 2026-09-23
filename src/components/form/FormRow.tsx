import { forwardRef, useId } from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '../../lib/theme';

export interface FormRowProps extends TextInputProps {
  label: string;
  /** Shown under the input in red, inside the row. */
  error?: string | null;
  /** Rendered before the text, e.g. a currency symbol. */
  prefix?: string;
  /** Set by ListSection; draws the hairline above every row but the first. */
  showSeparator?: boolean;
}

const LABEL_WIDTH = 116;

/** A text field as one row of an inset-grouped form, like editing a contact: the label on the
 * left, the value on the right (multiline fields put the label above). The label is also the
 * field's VoiceOver label. Put rows in a ListSection; explain them in the section footer. */
export const FormRow = forwardRef<TextInput, FormRowProps>(function FormRow(
  { label, error, prefix, showSeparator, multiline, style, ...inputProps },
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

  const input = (
    <TextInput
      ref={ref}
      className="flex-1 text-body text-label"
      style={[
        { minHeight: multiline ? 66 : 44, paddingVertical: multiline ? 4 : 11, textAlignVertical: multiline ? 'top' : 'center' },
        style,
      ]}
      placeholderTextColor={colors.placeholder}
      multiline={multiline}
      accessibilityLabel={label}
      accessibilityHint={error ?? undefined}
      inputAccessoryViewID={needsDoneBar ? accessoryId : undefined}
      {...inputProps}
    />
  );

  return (
    <View>
      {showSeparator ? <View style={{ marginLeft: 16, height: 0.5 }} className="bg-separator" /> : null}
      {multiline ? (
        <View className="px-4 pt-2.5 pb-1.5">
          <Text className="text-footnote text-secondary">{label}</Text>
          {input}
        </View>
      ) : (
        <View className="flex-row items-center px-4 min-h-[50px]">
          <Text className="text-body text-label" style={{ width: LABEL_WIDTH }} numberOfLines={2}>
            {label}
          </Text>
          {prefix ? <Text className="text-body text-secondary mr-1">{prefix}</Text> : null}
          {input}
        </View>
      )}
      {error ? <Text className="text-footnote text-destructive px-4 pb-2.5 -mt-1">{error}</Text> : null}
      {needsDoneBar ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View className="flex-row justify-end bg-elevated border-t border-separator px-4">
            <Pressable onPress={() => Keyboard.dismiss()} accessibilityRole="button" className="min-h-[44px] justify-center px-2">
              <Text className="text-body font-semibold text-tint">Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
});
