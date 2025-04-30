import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { ReplyModal } from './reply-modal';
import { EmailData } from '@/types/email';

// Define Props type locally or import if defined globally
type EmailReplyActionsProps = {
  isActionLoading: boolean;
  gmailTheme: any; // Using 'any' for now, replace with proper type (e.g., GmailTheme from types/email.ts)
  email?: EmailData & {
    cc?: string; // Make cc optional
  };
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
};

export function EmailReplyActions({
  isActionLoading,
  gmailTheme,
  email,
  onReply,
  onReplyAll,
  onForward,
}: EmailReplyActionsProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const [replyModalVisible, setReplyModalVisible] = React.useState(false);
  const [replyMode, setReplyMode] = React.useState<'reply' | 'reply-all' | 'forward'>('reply');

  // Early return if email is not provided
  if (!email) {
    return <View />;
  }

  const handleReply = () => {
    setReplyMode('reply');
    setReplyModalVisible(true);
    onReply?.();
  };

  const handleReplyAll = () => {
    setReplyMode('reply-all');
    setReplyModalVisible(true);
    onReplyAll?.();
  };

  const handleForward = () => {
    setReplyMode('forward');
    setReplyModalVisible(true);
    onForward?.();
  };

  const handleCloseModal = () => {
    setReplyModalVisible(false);
  };

  const buttonStyle = [
    styles.replyButton,
    { backgroundColor: isDark ? colors.background.secondary : '#F5F5F5' }
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
    <>
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
          onPress={handleReply}
          activeOpacity={0.6}
        >
          <Icon name="reply" size={20} color={iconColor} style={styles.replyIcon} />
          <Text style={textStyle}>Reply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={buttonStyle}
          disabled={isActionLoading}
          onPress={handleReplyAll}
          activeOpacity={0.6}
        >
          <Icon name="reply-all" size={20} color={iconColor} style={styles.replyIcon} />
          <Text style={textStyle}>Reply all</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={buttonStyle}
          disabled={isActionLoading}
          onPress={handleForward}
          activeOpacity={0.6}
        >
          <Icon name="forward" size={20} color={iconColor} style={styles.replyIcon} />
          <Text style={textStyle}>Forward</Text>
        </TouchableOpacity>
      </View>

      <ReplyModal
        visible={replyModalVisible}
        onClose={handleCloseModal}
        mode={replyMode}
        email={email}
        originalSubject={email.subject ?? ''}
        originalFrom={email.from ?? ''}
        originalTo={email.to ?? ''}
        originalCc={email.cc ?? ''}
      />
    </>
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