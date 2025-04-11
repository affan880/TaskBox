import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Attachment } from '../../../types/email'; // Assuming type moved

type EmailAttachmentItemProps = {
  attachment: Attachment;
  messageId: string; // Needed for the download function context
  downloadProgress: number; // Progress for this specific item (0-100)
  isDownloading: boolean; // Whether this specific item is downloading
  onDownloadPress: (messageId: string, attachment: Attachment) => void; // Function to trigger download
  gmailTheme: any; // TODO: Define stricter theme type
};

// Helper function to get file icon
function getFileIconName(type: string | undefined): string {
  // Rule: Function Purity
  const lowerType = type?.toLowerCase() || '';
  if (lowerType === 'pdf') return 'picture-as-pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(lowerType)) return 'image';
  if (['doc', 'docx'].includes(lowerType)) return 'description'; // Word icon
  if (['xls', 'xlsx', 'csv'].includes(lowerType)) return 'table-chart'; // Excel icon
  if (['ppt', 'pptx'].includes(lowerType)) return 'slideshow'; // PowerPoint icon
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(lowerType)) return 'folder-zip'; // Archive icon
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(lowerType)) return 'audio-file'; // Audio icon
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv'].includes(lowerType)) return 'video-file'; // Video icon
  if (['txt', 'log', 'md'].includes(lowerType)) return 'article'; // Text file icon
  return 'insert-drive-file'; // Generic file icon
}

export function EmailAttachmentItem({
  attachment,
  messageId,
  downloadProgress,
  isDownloading,
  onDownloadPress,
  gmailTheme,
}: EmailAttachmentItemProps): React.ReactElement {
  // Rule: Functional Component
  const iconName = getFileIconName(attachment.type);
  const isDark = gmailTheme?.text?.primary === '#E8EAED'; // Example check

  return (
    <TouchableOpacity
      style={[
        styles.attachmentCard,
        { backgroundColor: gmailTheme.attachment.background, borderColor: gmailTheme.border }
      ]}
      onPress={() => onDownloadPress(messageId, attachment)}
      disabled={isDownloading} // Disable button while downloading this item
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.attachmentIconContainer, { backgroundColor: isDark ? 'rgba(138, 180, 248, 0.2)' : 'rgba(26, 115, 232, 0.1)' }]}>
        <Icon name={iconName} size={24} color={gmailTheme.primary} />
      </View>

      {/* Details */}
      <View style={styles.attachmentDetails}>
        <Text style={[styles.attachmentName, { color: gmailTheme.text.primary }]} numberOfLines={1}>
          {attachment.name || 'Unnamed Attachment'}
        </Text>
        <Text style={[styles.attachmentInfo, { color: gmailTheme.text.secondary }]}>
          {(attachment.type || 'Unknown Type').toUpperCase()} • {attachment.sizeDisplay || 'Unknown Size'}
        </Text>
        {/* Rule: Conditional Rendering */}
        {isDownloading && (
          <Text style={[styles.downloadProgressText, { color: gmailTheme.primary }]}>
             {downloadProgress < 100 ? `Downloading ${downloadProgress}%...` : 'Processing...'}
          </Text>
        )}
         {/* TODO: Add indicator for already downloaded/cached files */}
      </View>
       {/* Optional: Add a download icon explicitly if needed, but card is pressable */}
       {/* <Icon name="download" size={20} color={gmailTheme.text.secondary} /> */}
    </TouchableOpacity>
  );
}

// Temporary GMAIL_COLORS reference
// TODO: Remove this
const GMAIL_COLORS = {
    dark: { /* ... */ primary: '#8AB4F8', text: { primary: '#E8EAED', secondary: '#9AA0A6' }, border: '#3C4043', attachment: { background: '#2C2C2E' } },
    light: { /* ... */ primary: '#1A73E8', text: { primary: '#202124', secondary: '#5F6368' }, border: '#DADCE0', attachment: { background: '#F1F3F4' } }
};

// Rule: Styles grouped at the bottom
const styles = StyleSheet.create({
  attachmentCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    padding: 12,
    overflow: 'hidden',
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentInfo: {
    fontSize: 12,
  },
  downloadProgressText: {
      fontSize: 12,
      marginTop: 4,
  },
});
