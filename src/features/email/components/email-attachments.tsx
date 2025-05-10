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
  onPress?: (attachment: Attachment) => void;
  onRemove?: (id: string) => void;
  downloadProgress?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  showRemoveButton?: boolean;
  disabled?: boolean;
};

function EmailAttachment({
  attachment,
  onPress,
  onRemove,
  downloadProgress,
  isUploading,
  uploadProgress,
  showRemoveButton = false,
  disabled = false,
}: EmailAttachmentProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress(attachment);
    }
  };

  const handleRemove = () => {
    if (!disabled && onRemove) {
      onRemove(attachment.id);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isUploading}
      style={[
        styles.attachmentCard,
        {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          transform: [{ rotate: '1deg' }],
        }
      ]}
    >
      <View style={[
        styles.attachmentIconContainer,
        {
          backgroundColor: '#ffde59',
          borderColor: '#000000',
          transform: [{ rotate: '-2deg' }],
        }
      ]}>
        <Icon name="insert-drive-file" size={24} color="#000000" />
      </View>

      <View style={styles.attachmentDetails}>
        <Text style={[styles.attachmentName, { color: '#000000' }]} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={[styles.attachmentInfo, { color: '#666666' }]}>
          {isUploading
            ? `Uploading... ${uploadProgress}%`
            : downloadProgress !== undefined
            ? `Downloading... ${downloadProgress}%`
            : `${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
        </Text>
      </View>

      {showRemoveButton && (
        <TouchableOpacity
          onPress={handleRemove}
          disabled={disabled || isUploading}
          style={[
            styles.removeButton,
            {
              backgroundColor: '#ff3333',
              borderColor: '#000000',
              transform: [{ rotate: '-1deg' }],
            }
          ]}
        >
          <Icon name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      {(isUploading || downloadProgress !== undefined) && (
        <ActivityIndicator
          size="small"
          color="#ff3333"
          style={{ marginLeft: 8 }}
        />
      )}
    </TouchableOpacity>
  );
}

// Attachments list component
type EmailAttachmentsProps = {
  attachments: Attachment[];
  onAttachmentPress?: (attachment: Attachment) => void;
  onRemoveAttachment?: (id: string) => void;
  downloadProgress?: { [key: string]: number };
  currentUploadId?: string | null;
  uploadProgress?: number;
  showRemoveButton?: boolean;
  disabled?: boolean;
};

export function EmailAttachments({
  attachments,
  onAttachmentPress,
  onRemoveAttachment,
  downloadProgress = {},
  currentUploadId = null,
  uploadProgress = 0,
  showRemoveButton = false,
  disabled = false,
}: EmailAttachmentsProps): React.ReactElement | null {
  // Don't render anything if there are no attachments
  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.titleContainer,
        {
          backgroundColor: '#0066ff',
          borderColor: '#000000',
          transform: [{ rotate: '-1deg' }],
        }
      ]}>
        <Text style={styles.title}>
          Attachments ({attachments.length})
        </Text>
      </View>
      <View style={styles.list}>
        {attachments.map((attachment) => (
          <EmailAttachment
            key={attachment.id}
            attachment={attachment}
            onPress={onAttachmentPress}
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
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  titleContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderRadius: 0,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  list: {
    gap: 12,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 4,
    borderRadius: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 4,
  },
  attachmentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  attachmentInfo: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});
