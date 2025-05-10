import * as React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.surface.secondary }]}>
      <FeatherIcon name="search" size={20} color={colors.text.secondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text.primary }]}
        placeholder="Search projects"
        placeholderTextColor={colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 