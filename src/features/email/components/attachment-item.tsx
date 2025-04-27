import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { EmailAttachment } from '@/types/email';

interface AttachmentItemProps {
  attachment: EmailAttachment;
  onRemove: (id: string) => void;
  currentUploadId: string | null;
  uploadProgress: number;
}

export function AttachmentItem({ 
  attachment, 
  onRemove, 
  currentUploadId, 
  uploadProgress 
}: AttachmentItemProps): React.ReactElement {
  const { colors } = useTheme();
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get appropriate icon for file type
  const getFileIcon = (type: string): string => {
    if (type.includes('image')) return 'image';
    if (type.includes('pdf')) return 'picture-as-pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('excel') || type.includes('sheet')) return 'table-chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('text')) return 'text-snippet';
    if (type.includes('zip') || type.includes('compressed')) return 'archive';
    return 'insert-drive-file';
  };

  // Status text for the attachment
  let statusText: string;
  if (attachment.isUploading) {
    statusText = 'Uploading...';
    if (attachment.id === currentUploadId) {
      statusText += ` ${Math.round(uploadProgress)}%`;
    }
  } else {
    statusText = formatFileSize(attachment.size);
  }

  const styles = StyleSheet.create({
    attachmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      backgroundColor: `${colors.brand.primary}08`,
      borderColor: colors.border.light,
    },
    attachmentContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    attachmentIcon: {
      width: 36,
      height: 36,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    attachmentDetails: {
      flex: 1,
    },
    attachmentName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
      color: colors.text.primary,
    },
    attachmentSize: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    attachmentRemove: {
      padding: 6,
    },
  });

  return (
    <View
      key={attachment.id}
      style={styles.attachmentItem}
    >
      <View style={styles.attachmentContent}>
        <View style={styles.attachmentIcon}>
          {attachment.isUploading ? (
            <ActivityIndicator 
              size="small" 
              color={colors.brand.primary} 
            />
          ) : (
            <Icon name={getFileIcon(attachment.type)} size={20} color={colors.brand.primary} />
          )}
        </View>
        <View style={styles.attachmentDetails}>
          <Text 
            style={styles.attachmentName}
            numberOfLines={1}
          >
            {attachment.name}
          </Text>
          <Text style={styles.attachmentSize}>
            {statusText}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.attachmentRemove}
        onPress={() => onRemove(attachment.id)}
        disabled={attachment.isUploading}
      >
        <Icon 
          name="close" 
          size={16} 
          color={attachment.isUploading ? colors.text.quaternary : colors.text.tertiary} 
        />
      </TouchableOpacity>
    </View>
  );
} 