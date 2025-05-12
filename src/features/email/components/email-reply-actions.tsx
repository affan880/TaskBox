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
    marginBottom: 12,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  replyIcon: {
    marginRight: 8,
    transform: [{ rotate: '-2deg' }],
  },
  replyText: {
    fontSize: 14,
    fontWeight: '700',
    transform: [{ rotate: '1deg' }],
  },
}); 