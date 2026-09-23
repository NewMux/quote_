import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../lib/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

/** An inline search field, styled like the iOS search bar, for sheets (which have no navigation bar
 * to host a native one). Filters as you type; the clear button empties it. */
export function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center bg-fill rounded-xl px-3 min-h-[40px]">
      <Ionicons name="search" size={17} color={colors.secondary} />
      <TextInput
        className="flex-1 text-[17px] text-label py-2 px-2"
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />
    </View>
  );
}
