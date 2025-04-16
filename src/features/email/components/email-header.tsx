import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';
import type { EdgeInsets } from 'react-native-safe-area-context';

export type EmailHeaderProps = {
  insets: EdgeInsets;
  screenTitle: string;
  onProfilePress: () => void;
};

export function EmailHeader({ insets, screenTitle, onProfilePress }: EmailHeaderProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    headerContainer: {
      paddingTop: insets.top + 8,
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background?.primary ?? '#ffffff',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border?.medium ?? '#e0e0e0',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchBarContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface?.secondary ?? '#f0f0f0',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
      marginRight: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text?.primary ?? '#000000',
      paddingVertical: 0,
    },
    avatarContainer: {
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.brand?.primary ?? '#007aff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text?.inverse ?? '#ffffff',
    },
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color={colors.text?.secondary ?? '#888888'} style={styles.searchIcon} />
          <TextInput 
            placeholder={`Search in ${screenTitle.toLowerCase()}...`}
            placeholderTextColor={colors.text?.secondary ?? '#888888'}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={onProfilePress}
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