import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Removed incorrect type import 'GmailTheme' if not defined globally

// Define Props type locally or import if defined globally
type EmailReplyActionsProps = {
  isActionLoading: boolean;
  gmailTheme: any; // Using 'any' for now, replace with proper type (e.g., GmailTheme from types/email.ts)
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
};

export function EmailReplyActions({
  isActionLoading,
  gmailTheme,
  onReply,
  onReplyAll,
  onForward,
}: EmailReplyActionsProps): React.ReactElement {
  // Rule: Functional Component
  // Assuming gmailTheme has the structure GMAIL_COLORS had previously
  // If not, this check needs adjustment based on the actual theme structure
  const isDark = gmailTheme?.background === '#1C1C1E';

  const buttonStyle = [
    styles.replyButton,
    // Add dynamic background/opacity for press state if desired
  ];

  // Ensure gmailTheme and its nested properties exist before accessing them
  const textColor = gmailTheme?.text?.secondary ?? '#5F6368'; // Default to a light mode secondary color
  const surfaceColor = gmailTheme?.surface ?? '#FFFFFF'; // Default to a light mode surface color
  const iconColor = textColor;

  const textStyle = [
    styles.replyText,
    { color: textColor }
  ];

  return (
    <View style={[
      styles.replySection,
      {
        backgroundColor: surfaceColor,
        shadowColor: isDark ? '#000000' : '#00000030', // Softer shadow for light mode
      }
    ]}>
      <TouchableOpacity
        style={buttonStyle}
        disabled={isActionLoading}
        onPress={onReply}
        activeOpacity={0.6}
      >
        <Icon name="reply" size={20} color={iconColor} style={styles.replyIcon} />
        <Text style={textStyle}>Reply</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={buttonStyle}
        disabled={isActionLoading}
        onPress={onReplyAll}
        activeOpacity={0.6}
      >
        <Icon name="reply-all" size={20} color={iconColor} style={styles.replyIcon} />
        <Text style={textStyle}>Reply all</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={buttonStyle}
        disabled={isActionLoading}
        onPress={onForward}
        activeOpacity={0.6}
      >
        <Icon name="forward" size={20} color={iconColor} style={styles.replyIcon} />
        <Text style={textStyle}>Forward</Text>
      </TouchableOpacity>
    </View>
  );
}

// Remove temporary GMAIL_COLORS object
// const GMAIL_COLORS = { ... };

// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  replySection: {
    marginHorizontal: 8,
    marginBottom: 8, // Keep margin bottom
    marginTop: 16, // Add margin top to separate from content
    borderRadius: 28, // Pill-shaped container like Gmail
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, // Slightly more shadow
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Elevation for Android shadow
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6, // Adjust vertical padding
    paddingHorizontal: 6, // Add horizontal padding
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Increase touchable area height
    paddingHorizontal: 12,
    borderRadius: 20, // Rounded buttons
    flex: 1, // Distribute space evenly
    justifyContent: 'center',
    marginHorizontal: 4, // Space between buttons
  },
  replyIcon: {
     marginRight: 8, // Space between icon and text
  },
  replyText: {
    fontSize: 14,
    fontWeight: '500', // Slightly bolder text
  },
}); 