import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { getCurrencySymbol, minorToDecimalString, parseToMinor } from '../lib/money';

interface MoneyInputProps {
  valueMinor: number;
  onChangeMinor: (minor: number) => void;
  currencyCode: string;
  label?: string;
}

export function MoneyInput({ valueMinor, onChangeMinor, currencyCode, label }: MoneyInputProps) {
  const [text, setText] = useState(minorToDecimalString(valueMinor, currencyCode));

  return (
    <View>
      {label ? <Text className="text-xs text-secondary mb-1">{label}</Text> : null}
      <View className="flex-row items-center border border-field rounded-lg px-3 py-2 bg-card">
        <Text className="text-secondary mr-1">{getCurrencySymbol(currencyCode)}</Text>
        <TextInput
          className="flex-1 text-base text-label"
          keyboardType="decimal-pad"
          value={text}
          onChangeText={setText}
          onEndEditing={() => {
            const minor = parseToMinor(text, currencyCode);
            setText(minorToDecimalString(minor, currencyCode));
            onChangeMinor(minor);
          }}
          placeholder={minorToDecimalString(0, currencyCode)}
        />
      </View>
    </View>
  );
}
