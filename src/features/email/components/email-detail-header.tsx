// src/screens/email/components/email-detail-header.tsx
import * as React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type EmailDetailHeaderProps = {
  gmailTheme: any; // Consider defining a stricter type for the theme
  isActionLoading: boolean;
  onGoBack: () => void;
  // Add other action handlers as needed (archive, delete, etc.)
};

export function EmailDetailHeader({
  gmailTheme,
  isActionLoading,
  onGoBack,
}: EmailDetailHeaderProps): React.ReactElement {
  // Rule: Functional Component
  return (
    <View
      style={[
        styles.gmailHeader,
        {
          backgroundColor: gmailTheme.surface,
          borderBottomColor: gmailTheme.border,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          disabled={isActionLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color={gmailTheme.text.secondary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* TODO: Implement action handlers */}
          <TouchableOpacity
            style={styles.headerIconButton}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="archive" size={22} color={gmailTheme.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="delete" size={22} color={gmailTheme.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="mail-outline" size={22} color={gmailTheme.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="more-vert" size={22} color={gmailTheme.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  gmailHeader: {
    height: 56,        // Standard header height
    borderBottomWidth: 1,
    zIndex: 10,        // Ensure header stays on top
    marginTop:40,      // TODO: This margin might need context (safe area)
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,        // Increase touch area
    marginRight: 12,   // Space before actions
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,        // Increase touch area
    marginLeft: 12,   // Space between icons
  },
});