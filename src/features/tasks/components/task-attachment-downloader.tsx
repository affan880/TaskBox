import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { TaskAttachment } from '@/types/task';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { formatFileSize, getFileIcon, openFile } from './task-attachment-utils';

type TaskAttachmentDownloaderProps = {
  attachment: TaskAttachment;
  showDownloadButton?: boolean;
  onView?: (attachment: TaskAttachment) => void;
};

export function TaskAttachmentDownloader({ 
  attachment, 
  showDownloadButton = true,
  onView
}: TaskAttachmentDownloaderProps) {
  const { colors, isDark } = useTheme();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Handle downloading the attachment
  const handleDownload = useCallback(async () => {
    if (downloadProgress !== null) return; // Already downloading
    
    const filename = attachment.name;
    const sanitizedFilename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
    
    // Different paths for iOS and Android
    const targetDir = Platform.OS === 'ios' 
      ? `${RNBlobUtil.fs.dirs.DocumentDir}/TaskBox/Attachments`
      : `${RNBlobUtil.fs.dirs.DownloadDir}/TaskBox`;
    
    try {
      // Ensure directory exists
      const dirExists = await RNBlobUtil.fs.exists(targetDir);
      if (!dirExists) {
        await RNBlobUtil.fs.mkdir(targetDir);
      }
      
      const filePath = `${targetDir}/${sanitizedFilename}`;
      
      // Check if file already exists
      const fileExists = await RNBlobUtil.fs.exists(filePath);
      if (fileExists) {
        setIsDownloaded(true);
        Alert.alert(
          'File Already Downloaded',
          `"${filename}" is already downloaded. Do you want to open it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => openFile(filePath, attachment.type) }
          ]
        );
        return;
      }
      
      // Start downloading
      setDownloadProgress(0);
      
      // Download from the attachment's download URL
      if (!attachment.downloadUrl) {
        Alert.alert('Error', 'Download URL not available');
        setDownloadProgress(null);
        return;
      }
      
      const task = RNBlobUtil.config({
        path: filePath,
        fileCache: true,
        addAndroidDownloads: Platform.OS === 'android' ? {
          useDownloadManager: true,
          notification: true,
          title: filename,
          description: 'Downloading file',
          mime: attachment.type,
          mediaScannable: true,
        } : undefined,
      }).fetch('GET', attachment.downloadUrl);
      
      task.progress({ interval: 250 }, (received, total) => {
        setDownloadProgress(Math.round((received / total) * 100));
      });
      
      const res = await task;
      
      // Get path to the downloaded file
      const downloadedPath = res.path();
      
      setDownloadProgress(100);
      setIsDownloaded(true);
      
      // Offer to open the file
      Alert.alert(
        'Download Complete',
        `"${filename}" has been downloaded. Do you want to open it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => openFile(downloadedPath, attachment.type) }
        ]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download the file');
      setDownloadProgress(null);
    }
  }, [attachment, downloadProgress]);
  
  // Handle opening the attachment
  const handleOpen = useCallback(async () => {
    if (onView) {
      onView(attachment);
      return;
    }
    
    try {
      // If already downloaded
      if (isDownloaded) {
        const targetDir = Platform.OS === 'ios' 
          ? `${RNBlobUtil.fs.dirs.DocumentDir}/TaskBox/Attachments`
          : `${RNBlobUtil.fs.dirs.DownloadDir}/TaskBox`;
        const sanitizedFilename = attachment.name.replace(/[\/\\?%*:|"<>]/g, '_');
        const filePath = `${targetDir}/${sanitizedFilename}`;
        
        const fileExists = await RNBlobUtil.fs.exists(filePath);
        if (fileExists) {
          await openFile(filePath, attachment.type);
          return;
        }
      }
      
      // If has a local URI
      if (attachment.uri) {
        await openFile(attachment.uri, attachment.type);
        return;
      }
      
      // Needs to be downloaded
      if (attachment.downloadUrl) {
        handleDownload();
      } else {
        Alert.alert('Error', 'File cannot be opened');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open the file');
    }
  }, [attachment, isDownloaded, handleDownload, onView]);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fileInfo}
        onPress={handleOpen}
      >
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Icon name={getFileIcon(attachment.type)} size={20} color={colors.brand.primary} />
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={[styles.fileName, { color: colors.text.primary }]} numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text style={[styles.fileSize, { color: colors.text.tertiary }]}>
            {formatFileSize(attachment.size)}
          </Text>
        </View>
      </TouchableOpacity>
      
      {showDownloadButton && attachment.downloadUrl && !isDownloaded && downloadProgress === null && (
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.brand.primary }]}
          onPress={handleDownload}
        >
          <Icon name="download" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      
      {downloadProgress !== null && downloadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressIndicator,
                { 
                  width: `${downloadProgress}%`,
                  backgroundColor: colors.brand.primary
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.text.secondary }]}>
            {downloadProgress}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  downloadButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    padding: 12,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
}); 