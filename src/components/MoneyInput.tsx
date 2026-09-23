import { useState } from 'react';
import { FormRow } from './form/FormRow';
import { getCurrencySymbol, minorToDecimalString, parseToMinor } from '../lib/money';

interface MoneyInputProps {
  valueMinor: number;
  onChangeMinor: (minor: number) => void;
  currencyCode: string;
  label: string;
  error?: string | null;
  /** Set by ListSection. */
  showSeparator?: boolean;
}

/** An amount row for a grouped form. Reports the parsed value on every keystroke (so a Save tapped
 * mid-edit uses what's on screen) and tidies the formatting when editing ends. */
export function MoneyInput({ valueMinor, onChangeMinor, currencyCode, label, error, showSeparator }: MoneyInputProps) {
  const [text, setText] = useState(minorToDecimalString(valueMinor, currencyCode));

  return (
    <FormRow
      label={label}
      error={error}
      showSeparator={showSeparator}
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
