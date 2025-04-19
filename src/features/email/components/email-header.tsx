import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';
import type { EdgeInsets } from 'react-native-safe-area-context';

export type EmailHeaderProps = {
  insets: EdgeInsets;
  screenTitle: string;
  onProfilePress: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
};

export function EmailHeader({ 
  insets, 
  screenTitle, 
  onProfilePress, 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit, 
  onClearSearch 
}: EmailHeaderProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    headerContainer: {
      paddingTop: insets.top,
      paddingBottom: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.background?.primary ?? '#ffffff',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchBarContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface?.secondary ?? '#f3f4f6',
      borderRadius: 24,
      paddingHorizontal: 16,
      height: 48,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text?.primary ?? '#000000',
      paddingVertical: 10,
      fontWeight: '400',
    },
    avatarContainer: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.brand?.primary ?? '#6366f1',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text?.inverse ?? '#ffffff',
    },
    clearButton: {
      padding: 6,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={22} color={colors.text?.tertiary ?? '#6b7280'} style={styles.searchIcon} />
          <TextInput 
            placeholder={`Search in all inbox...`}
            placeholderTextColor={colors.text?.tertiary ?? '#6b7280'}
            style={styles.searchInput}
            returnKeyType="search"
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={onClearSearch} style={styles.clearButton} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Icon name="cancel" size={20} color={colors.text?.tertiary ?? '#6b7280'} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={onProfilePress}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SA</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Add displayName property
EmailHeader.displayName = 'EmailHeader'; 