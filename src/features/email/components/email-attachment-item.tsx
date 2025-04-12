import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Attachment } from 'src/types/email'; // Assuming type moved

type EmailAttachmentItemProps = {
  attachment: Attachment;
  messageId: string; // Needed for the download function context
  downloadProgress: number; // Progress: 0 (idle), >0 & <100 (downloading), 100 (complete), -1 (error)
  onDownloadPress: (messageId: string, attachment: Attachment) => void; // Function to trigger download
  gmailTheme: any; // TODO: Define stricter theme type
};

// Helper function to get file extension from MIME type
function getFileExtensionFromMime(mimeType: string | undefined): string {
  if (!mimeType) return '';
  return mimeType.split('/').pop()?.split('.').pop() || '';
}

// Helper function to get file icon
function getFileIconName(mimeType: string | undefined): string {
  const extension = getFileExtensionFromMime(mimeType).toLowerCase();
  // Rule: Function Purity
  if (extension === 'pdf') return 'picture-as-pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
  if (['doc', 'docx'].includes(extension)) return 'description';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'table-chart';
  if (['ppt', 'pptx'].includes(extension)) return 'slideshow';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'folder-zip';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) return 'audio-file';
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv'].includes(extension)) return 'video-file';
  if (['txt', 'log', 'md'].includes(extension)) return 'article';
  return 'insert-drive-file'; // Generic file icon
}

// Helper function to format bytes into KB/MB/GB
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function EmailAttachmentItem({
  attachment,
  messageId,
  downloadProgress,
  onDownloadPress,
  gmailTheme,
}: EmailAttachmentItemProps): React.ReactElement {
  // Rule: Functional Component
  const iconName = getFileIconName(attachment.mimeType);
  const fileSizeDisplay = formatBytes(attachment.size);
  const isDownloading = downloadProgress > 0 && downloadProgress < 100;
  const isComplete = downloadProgress === 100;
  const hasError = downloadProgress === -1;

  const isDark = gmailTheme?.text?.primary === '#E8EAED'; // Example check

  return (
    <TouchableOpacity
      style={[
        styles.attachmentCard,
        { backgroundColor: gmailTheme.attachment.background, borderColor: gmailTheme.border }
      ]}
      onPress={() => onDownloadPress(messageId, attachment)}
      disabled={isDownloading} // Only disable while actively downloading
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.attachmentIconContainer, { backgroundColor: isDark ? 'rgba(138, 180, 248, 0.2)' : 'rgba(26, 115, 232, 0.1)' }]}>
        <Icon 
          name={isComplete ? 'check-circle' : hasError ? 'error' : iconName} 
          size={24} 
          color={isComplete ? 'green' : hasError ? 'red' : gmailTheme.primary} 
        />
      </View>

      {/* Details */}
      <View style={styles.attachmentDetails}>
        <Text style={[styles.attachmentName, { color: gmailTheme.text.primary }]} numberOfLines={1}>
          {attachment.filename || 'Unnamed Attachment'}
        </Text>
        <Text style={[styles.attachmentInfo, { color: gmailTheme.text.secondary }]}>
          {(getFileExtensionFromMime(attachment.mimeType) || 'Unknown Type').toUpperCase()} • {fileSizeDisplay}
        </Text>
        {/* Rule: Conditional Rendering */}
        {isDownloading && (
          <Text style={[styles.downloadProgressText, { color: gmailTheme.primary }]}>
            {`Downloading ${downloadProgress}%...`}
          </Text>
        )}
        {isComplete && (
          <Text style={[styles.downloadProgressText, { color: 'green' }]}>
            Downloaded
          </Text>
        )}
        {hasError && (
          <Text style={[styles.downloadProgressText, { color: 'red' }]}>
            Download Failed
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
