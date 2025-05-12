import * as React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';

type Props = {
  insets: EdgeInsets;
  screenTitle: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  onCompose: () => void;
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
  onCompose,
  onSmartSort,
  isSmartSorting = false,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background?.primary }]}>
      <View style={styles.header}>
        {/* <Text style={[styles.title, { color: colors.text?.primary }]}>
          {screenTitle}
        </Text> */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.background?.secondary }]}>
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
            style={[styles.composeButton, { backgroundColor: colors.brand.primary }]}
            onPress={onCompose}
          >
            <Icon name="pencil" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.brand.primary }]}
            onPress={onSmartSort}
            disabled={isSmartSorting}
          >
            {isSmartSorting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Image 
                source={require('@/assets/images/feather.png')}
                style={[styles.featherIcon, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#000000',
    gap: 8,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '1deg' }],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: Platform.select({ ios: 8, android: 4 }),
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  featherIcon: {
    width: 24,
    height: 24,
    transform: [{ rotate: '-15deg' }],
  },
});

// Add displayName property
EmailHeader.displayName = 'EmailHeader'; 