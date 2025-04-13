import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { TaskAttachment } from '@/types/task';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';

type TaskAttachmentDownloaderProps = {
  attachment: TaskAttachment;
  showDownloadButton?: boolean;
};

export function TaskAttachmentDownloader({ attachment, showDownloadButton = true }: TaskAttachmentDownloaderProps) {
  const { colors, isDark } = useTheme();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

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
            { text: 'Open', onPress: () => openFile(filePath) }
          ]
        );
        return;
      }
      
      // Start downloading
      setDownloadProgress(0);
      
      // For file URLs, download from network
      if (attachment.uri.startsWith('http')) {
        // Download with progress tracking
        RNBlobUtil.config({
          fileCache: true,
          path: filePath,
          addAndroidDownloads: Platform.OS === 'android' ? {
            useDownloadManager: true,
            notification: true,
            title: filename,
            description: 'Downloading attachment',
            mime: attachment.type,
            mediaScannable: true,
          } : undefined,
        })
          .fetch('GET', attachment.uri)
          .progress((received, total) => {
            const percentage = Math.floor((Number(received) / Number(total)) * 100);
            setDownloadProgress(percentage);
          })
          .then(res => {
            setDownloadProgress(100);
            setIsDownloaded(true);
            
            Alert.alert(
              'Download Complete',
              `Attachment "${filename}" downloaded. Open it?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open', onPress: () => openFile(res.path()) }
              ]
            );
          })
          .catch(error => {
            console.error('Download error:', error);
            setDownloadProgress(null);
            Alert.alert('Download Failed', 'Could not download the attachment.');
          });
      } else {
        // For local URIs, copy the file
        try {
          // Copy file with progress simulation
          setDownloadProgress(10);
          await RNBlobUtil.fs.cp(attachment.uri, filePath);
          setDownloadProgress(100);
          setIsDownloaded(true);
          
          Alert.alert(
            'Download Complete',
            `Attachment "${filename}" downloaded. Open it?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open', onPress: () => openFile(filePath) }
            ]
          );
        } catch (error) {
          console.error('File copy error:', error);
          setDownloadProgress(null);
          Alert.alert('Download Failed', 'Could not copy the attachment.');
        }
      }
    } catch (error) {
      console.error('Download setup error:', error);
      setDownloadProgress(null);
      Alert.alert('Error', 'Failed to prepare download.');
    }
  }, [attachment, downloadProgress]);

  // Open file with the default viewer
  const openFile = useCallback((filePath: string) => {
    FileViewer.open(filePath, { showOpenWithDialog: true })
      .catch(error => {
        console.error('Error opening file:', error);
        Alert.alert('Error', 'Could not open the file. You may need a specific app to view this file type.');
      });
  }, []);

  // Render download button or progress indicator
  const renderDownloadStatus = () => {
    if (downloadProgress === null) {
      // Not downloading yet
      return (
        <TouchableOpacity
          style={[
            styles.downloadButton,
            { backgroundColor: colors.brand.primary }
          ]}
          onPress={handleDownload}
          disabled={!showDownloadButton}
        >
          <Icon name="file-download" size={20} color="#FFFFFF" />
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      );
    } else if (downloadProgress < 100) {
      // In progress
      return (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                backgroundColor: colors.brand.primary,
                width: `${downloadProgress}%` 
              }
            ]} 
          />
          <Text style={styles.progressText}>{downloadProgress}%</Text>
        </View>
      );
    } else {
      // Downloaded
      return (
        <View style={[styles.downloadedIndicator, { backgroundColor: colors.status.success }]}>
          <Icon name="check" size={16} color="#FFFFFF" />
          <Text style={styles.downloadedText}>Downloaded</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fileInfo}>
        <View style={styles.iconContainer}>
          <Icon 
            name={getFileIcon(attachment.type)} 
            size={28} 
            color={colors.brand.primary} 
          />
        </View>
        <View style={styles.fileDetails}>
          <Text 
            style={[styles.fileName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {attachment.name}
          </Text>
          <Text style={[styles.fileSize, { color: colors.text.tertiary }]}>
            {formatFileSize(attachment.size)}
          </Text>
        </View>
      </View>
      
      {renderDownloadStatus()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f1f5ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(120, 139, 255, 0.2)',
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontWeight: '500',
    fontSize: 14,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressContainer: {
    width: 100,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000',
    fontSize: 12,
    lineHeight: 24,
  },
  downloadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  downloadedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  }
}); 