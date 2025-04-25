import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskAttachment } from '@/types/task';
import { useFileManager } from '@/lib/file-manager/use-file-manager';
import { formatFileSize, getFileIcon } from './task-attachment-utils';
import { useTheme } from '@/theme/theme-context';

type TaskAttachmentManagerProps = {
  attachment: TaskAttachment;
  onView?: (attachment: TaskAttachment) => void;
  onPress?: () => void;
};

export function TaskAttachmentManager({ 
  attachment, 
  onView,
  onPress
}: TaskAttachmentManagerProps) {
  const { colors } = useTheme();
  const { downloadAndOpen, progress, isLoading, error } = useFileManager();
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  const handleDownload = useCallback(async () => {
    try {
      if (!attachment.downloadUrl) {
        console.error('No download URL available for attachment:', attachment);
        return;
      }
      
      const filePath = await downloadAndOpen({
        url: attachment.downloadUrl,
        filename: attachment.name,
        mimeType: attachment.type
      });
      
      // If file path is returned, the download was successful
      if (filePath) {
        setIsDownloaded(true);
      }
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  }, [attachment, downloadAndOpen]);
  
  const handlePress = useCallback(() => {
    // If there's a specific onPress handler, use it
    if (onPress) {
      onPress();
      return;
    }
    
    // If there's a downloadUrl, download the file
    if (attachment.downloadUrl) {
      handleDownload();
      return;
    }
    
    // If there's a view handler, use it
    if (onView) {
      onView(attachment);
    }
  }, [attachment, handleDownload, onPress, onView]);
  
  const showProgress = isLoading && progress > 0 && progress < 100;
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      disabled={isLoading || attachment.isUploading}
    >
      <View style={styles.iconContainer}>
        {attachment.isUploading ? (
          <ActivityIndicator color={colors.brand.primary} size="small" />
        ) : isLoading ? (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        ) : (
          <Icon 
            name={getFileIcon(attachment.type)} 
            size={24} 
            color={colors.brand.primary}
          />
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text 
          style={[styles.fileName, { color: colors.text.primary }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {attachment.name}
        </Text>
        
        <Text style={[styles.fileDetails, { color: colors.text.tertiary }]}>
          {attachment.isUploading ? (
            'Uploading...'
          ) : isLoading ? (
            'Downloading...'
          ) : (
            formatFileSize(attachment.size)
          )}
          {' · '}
          {attachment.type.split('/')[1]?.toUpperCase() || attachment.type}
        </Text>
      </View>
      
      {!attachment.isUploading && !isLoading && attachment.downloadUrl && (
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={handleDownload}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon 
            name={isDownloaded ? "check-circle" : "download"} 
            size={20} 
            color={isDownloaded ? colors.status.success : colors.brand.primary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f7ff',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e6ebff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e6ebff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileDetails: {
    fontSize: 12,
  },
  downloadButton: {
    padding: 8,
  },
}); 