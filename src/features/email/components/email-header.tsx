import * as React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useTheme } from 'src/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';

type Props = {
  insets: EdgeInsets;
  screenTitle: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  onSmartSort: () => void;
  isSmartSorting?: boolean;
};

export function EmailHeader({
  insets,
  screenTitle,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onSmartSort,
  isSmartSorting = false,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Platform.OS === 'ios' ? 30 : 60,
          backgroundColor: colors.background?.primary ?? '#ffffff',
          borderBottomColor: colors.border?.light ?? '#e1e1e1',
        },
      ]}
    >
      <View style={styles.header}>
        {/* <Text style={[styles.title, { color: colors.text?.primary }]}>
          {screenTitle}
        </Text> */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.background?.secondary ?? '#f5f5f5' },
            ]}
          >
            <Icon name="magnify" size={20} color={colors.text?.secondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text?.primary }]}
              placeholder="Search emails"
              placeholderTextColor={colors.text?.secondary}
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={onClearSearch}>
                <Icon name="close" size={20} color={colors.text?.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.brand.primary }]}
            onPress={onSmartSort}
            disabled={isSmartSorting}
          >
            {isSmartSorting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="sort" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.select({ ios: 8, android: 4 }),
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  featherIcon: {
    width: 24,
    height: 24,
    transform: [{ rotate: '-45deg' }],
  },
});

// Add displayName property
EmailHeader.displayName = 'EmailHeader'; 