import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Attachment } from 'src/types/email';
import { EmailAttachmentItem } from './email-attachment-item';

type EmailAttachmentsProps = {
  attachments: Attachment[];
  messageId: string;
  downloadProgress: Record<string, number>; // Map of attachmentId to progress
  onDownloadPress: (messageId: string, attachment: Attachment) => void;
  gmailTheme: any; // TODO: Define stricter theme type
};

export function EmailAttachments({
  attachments,
  messageId,
  downloadProgress,
  onDownloadPress,
  gmailTheme,
}: EmailAttachmentsProps): React.ReactElement | null {
  // Rule: Functional Component
  // Rule: Conditional Rendering (Early exit)
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={[styles.attachmentsSection, { borderTopColor: gmailTheme.border }]}>
      <Text style={[styles.attachmentsHeading, { color: gmailTheme.text.primary }]}>
        Attachments ({attachments.length})
      </Text>
      {attachments.map((attachment, index) => {
        const progress = downloadProgress[attachment.id] || 0;
        const isDownloading = progress > 0; // Considered downloading if progress started

        return (
          // Rule: Use Fragments for lists
          <React.Fragment key={`attachment-${attachment.id || index}`}>
            <EmailAttachmentItem
              attachment={attachment}
              messageId={messageId}
              downloadProgress={progress}
              isDownloading={isDownloading}
              onDownloadPress={onDownloadPress}
              gmailTheme={gmailTheme}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Temporary GMAIL_COLORS reference
// TODO: Remove this
const GMAIL_COLORS = {
    dark: { text: { primary: '#E8EAED' }, border: '#3C4043' },
    light: { text: { primary: '#202124' }, border: '#DADCE0' }
};


// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  attachmentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8, // Less padding at the bottom of the section
    borderTopWidth: 1,
    // borderTopColor set dynamically
  },
  attachmentsHeading: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16, // More space below heading
  },
});
