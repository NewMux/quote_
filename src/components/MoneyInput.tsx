import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { minorToDecimalString, parseToMinor } from '../lib/money';

interface MoneyInputProps {
  valueMinor: number;
  onChangeMinor: (minor: number) => void;
  currencySymbol?: string;
  label?: string;
}

export function MoneyInput({ valueMinor, onChangeMinor, currencySymbol = '$', label }: MoneyInputProps) {
  const [text, setText] = useState(minorToDecimalString(valueMinor));

  return (
    <View>
      {label ? <Text className="text-xs text-gray-500 mb-1">{label}</Text> : null}
      <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
        <Text className="text-gray-500 mr-1">{currencySymbol}</Text>
        <TextInput
          className="flex-1 text-base text-gray-900"
          keyboardType="decimal-pad"
          value={text}
          onChangeText={setText}
          onEndEditing={() => {
            const minor = parseToMinor(text);
            setText(minorToDecimalString(minor));
            onChangeMinor(minor);
          }}
          placeholder="0.00"
        />
      </View>
    </View>
  );
}
