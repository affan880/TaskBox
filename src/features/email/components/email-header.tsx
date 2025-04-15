import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../theme/theme';
import type { EdgeInsets } from 'react-native-safe-area-context';

export type EmailHeaderProps = {
  insets: EdgeInsets;
  screenTitle: string;
  onProfilePress: () => void;
};

export const EmailHeader = React.memo(({ insets, screenTitle, onProfilePress }: EmailHeaderProps) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top,
          backgroundColor: '#ffffff',
          borderBottomColor: 'rgba(120, 139, 255, 0.2)',
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View 
            style={[
              styles.searchBar,
              { 
                flex: 1,
                backgroundColor: '#f1f5ff',
                borderWidth: 1,
                borderColor: 'rgba(120, 139, 255, 0.2)',
                marginRight: 8,
              }
            ]}
          >
            <Icon name="search" size={22} color={colors.brand.primary} style={styles.searchIcon} />
            <Text style={[styles.searchText, { color: colors.text.secondary }]}>
              Search in {screenTitle.toLowerCase()}...
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={() => {
                console.log('AI button pressed');
              }}
            >
              <Image 
                source={require('../../../../assets/images/feather.png')}
                style={{ width: 24, height: 24, tintColor: colors.brand.primary }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={onProfilePress}
            >
              <View style={[styles.avatar, { backgroundColor: colors.brand.primary }]}>
                <Text style={styles.avatarText}>SA</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#ffffff', 
    zIndex: 1000,
    height: 'auto',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 139, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  header: {
    width: '100%',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    height: 40,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    padding: SPACING.sm,
  },
  avatarContainer: {
    padding: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
}); 