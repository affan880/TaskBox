import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import type { Attachment } from '@/types/email';

// Helper functions
function getFileExtensionFromMime(mimeType: string | undefined): string {
  if (!mimeType) return '';
  return mimeType.split('/').pop()?.split('.').pop() || '';
}

function getFileIconName(mimeType: string | undefined): string {
  const extension = getFileExtensionFromMime(mimeType).toLowerCase();
  if (extension === 'pdf') return 'picture-as-pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
  if (['doc', 'docx'].includes(extension)) return 'description';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'table-chart';
  if (['ppt', 'pptx'].includes(extension)) return 'slideshow';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'folder-zip';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) return 'audio-file';
  if (['mp4', 'mov', 'avi', 'wmv', 'mkv'].includes(extension)) return 'video-file';
  if (['txt', 'log', 'md'].includes(extension)) return 'article';
  return 'insert-drive-file';
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Individual attachment component
type EmailAttachmentProps = {
  attachment: Attachment;
  messageId: string;
  onPress?: (attachment: Attachment) => void;
  onDownloadPress?: (messageId: string, attachment: Attachment) => Promise<void>;
  onRemove?: (id: string) => void;
  downloadProgress?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  showRemoveButton?: boolean;
  disabled?: boolean;
};

function EmailAttachment({
  attachment,
  messageId,
  onPress,
  onDownloadPress,
  onRemove,
  downloadProgress = 0,
  isUploading = false,
  uploadProgress = 0,
  showRemoveButton = false,
  disabled = false,
}: EmailAttachmentProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  
  const iconName = getFileIconName(attachment.mimeType);
  const fileSizeDisplay = formatBytes(attachment.size);
  const isDownloading = downloadProgress > 0 && downloadProgress < 100;
  const isComplete = downloadProgress === 100;
  const hasError = downloadProgress === -1;

  let statusText: string;
  if (isUploading) {
    statusText = `Uploading ${Math.round(uploadProgress)}%`;
  } else if (isDownloading) {
    statusText = `Downloading ${Math.round(downloadProgress)}%`;
  } else if (isComplete) {
    statusText = 'Downloaded';
  } else if (hasError) {
    statusText = 'Download Failed';
  } else {
    statusText = fileSizeDisplay;
  }

  return (
    <View style={[styles.attachmentCard, { 
      backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
      borderColor: colors.border.light,
    }]}>
      <TouchableOpacity
        style={[styles.attachmentIconContainer, {
          backgroundColor: isDark ? 'rgba(138, 180, 248, 0.2)' : 'rgba(26, 115, 232, 0.1)',
        }]}
        onPress={() => onDownloadPress?.(messageId, attachment)}
        disabled={disabled || isUploading || isDownloading}
      >
        {isUploading || isDownloading ? (
          <ActivityIndicator 
            size="small" 
            color={colors.brand.primary} 
          />
        ) : (
          <Icon 
            name={isComplete ? 'check-circle' : hasError ? 'error' : iconName} 
            size={24} 
            color={isComplete ? colors.status.success : 
                   hasError ? colors.status.error : 
                   colors.brand.primary} 
          />
        )}
      </TouchableOpacity>

      <View style={styles.attachmentDetails}>
        <Text style={[styles.attachmentName, { color: colors.text.primary }]} numberOfLines={1}>
          {attachment.filename || 'Unnamed Attachment'}
        </Text>
        <Text style={[styles.attachmentInfo, { color: colors.text.secondary }]}>
          {(getFileExtensionFromMime(attachment.mimeType) || 'Unknown Type').toUpperCase()} • {statusText}
        </Text>
      </View>

      {showRemoveButton && onRemove && !isUploading && !isDownloading && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(attachment.id)}
          disabled={disabled}
        >
          <Icon 
            name="close" 
            size={16} 
            color={colors.text.tertiary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Attachments list component
type EmailAttachmentsProps = {
  attachments: Attachment[];
  messageId: string;
  onAttachmentPress?: (attachment: Attachment) => void;
  onDownloadPress?: (messageId: string, attachment: Attachment) => Promise<void>;
  onRemoveAttachment?: (id: string) => void;
  downloadProgress?: { [key: string]: number };
  currentUploadId?: string | null;
  uploadProgress?: number;
  showRemoveButton?: boolean;
  disabled?: boolean;
  gmailTheme?: any;
};

export function EmailAttachments({
  attachments,
  messageId,
  onAttachmentPress,
  onDownloadPress,
  onRemoveAttachment,
  downloadProgress = {},
  currentUploadId = null,
  uploadProgress = 0,
  showRemoveButton = false,
  disabled = false,
  gmailTheme,
}: EmailAttachmentsProps): React.ReactElement | null {
  const { colors } = useTheme();

  // Don't render anything if there are no attachments
  if (attachments.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: colors.text.secondary,
    },
    list: {
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Attachments ({attachments.length})
      </Text>
      <View style={styles.list}>
        {attachments.map((attachment) => (
          <EmailAttachment
            key={attachment.id}
            attachment={attachment}
            messageId={messageId}
            onPress={onAttachmentPress}
            onDownloadPress={onDownloadPress}
            onRemove={onRemoveAttachment}
            downloadProgress={downloadProgress[attachment.id]}
            isUploading={attachment.id === currentUploadId}
            uploadProgress={uploadProgress}
            showRemoveButton={showRemoveButton}
            disabled={disabled}
          />
        ))}
      </View>
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
  removeButton: {
    padding: 6,
    marginLeft: 8,
  },
});
