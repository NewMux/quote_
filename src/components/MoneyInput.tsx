import { useState } from 'react';
import { FormField } from './form/FormField';
import { getCurrencySymbol, minorToDecimalString, parseToMinor } from '../lib/money';

interface MoneyInputProps {
  valueMinor: number;
  onChangeMinor: (minor: number) => void;
  currencyCode: string;
  label: string;
  hint?: string;
}

/** Amount entry. Reports the parsed value on every keystroke (so a Save tapped mid-edit uses what's
 * on screen) and tidies the formatting when editing ends. */
export function MoneyInput({ valueMinor, onChangeMinor, currencyCode, label, hint }: MoneyInputProps) {
  const [text, setText] = useState(minorToDecimalString(valueMinor, currencyCode));

  return (
    <FormField
      label={label}
      hint={hint}
      prefix={getCurrencySymbol(currencyCode)}
      keyboardType="decimal-pad"
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChangeMinor(parseToMinor(next, currencyCode));
      }}
      onEndEditing={() => setText(minorToDecimalString(parseToMinor(text, currencyCode), currencyCode))}
      placeholder={minorToDecimalString(0, currencyCode)}
    />
  );
}
