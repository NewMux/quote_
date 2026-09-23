import { TextInput, View } from 'react-native';
import { Icon } from './Icon';
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
    <View className="flex-row items-center bg-secondaryfill rounded-full px-3 min-h-[40px]">
      <Icon name="magnifyingglass" size={16} color={colors.secondary} />
      <TextInput
        className="flex-1 text-body text-label py-2 px-2"
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
