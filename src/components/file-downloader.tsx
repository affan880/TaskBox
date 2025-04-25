import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import RNBlobUtil from 'react-native-blob-util';
import { getFileIconByType } from '@/utils/validation';
import { formatFileSize } from '@/utils/formatting';

type FileDownloaderProps = {
  id: string;
  name: string;
  type: string;
  size: number;
  downloadUrl: string;
  onOpenComplete?: () => void;
}

export function FileDownloader({
  id,
  name,
  type,
  size,
  downloadUrl,
  onOpenComplete
}: FileDownloaderProps) {
  const { colors } = useTheme();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [localFilePath, setLocalFilePath] = React.useState<string | null>(null);
  
  const iconName = getFileIconByType(type);
  
  // Get directory path based on platform
  const getDownloadDir = React.useCallback(() => {
    if (Platform.OS === 'ios') {
      return `${RNBlobUtil.fs.dirs.DocumentDir}/TaskBox/Downloads`;
    } else {
      return `${RNBlobUtil.fs.dirs.DownloadDir}/TaskBox`;
    }
  }, []);
  
  // Create directory if it doesn't exist
  const createDownloadDir = React.useCallback(async () => {
    const dir = getDownloadDir();
    const exists = await RNBlobUtil.fs.exists(dir);
    
    if (!exists) {
      try {
        await RNBlobUtil.fs.mkdir(dir);
      } catch (error) {
        console.error('Error creating download directory:', error);
        throw new Error('Failed to create download directory');
      }
    }
    
    return dir;
  }, [getDownloadDir]);
  
  // Download the file
  const downloadFile = React.useCallback(async () => {
    if (!downloadUrl) {
      Alert.alert('Error', 'Download URL is not available');
      return;
    }
    
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Create directories if needed
      const downloadDir = await createDownloadDir();
      
      // Sanitize filename
      const sanitizedName = name.replace(/[\/\\?%*:|"<>]/g, '_');
      const targetPath = `${downloadDir}/${sanitizedName}`;
      
      // Check if file already exists
      const fileExists = await RNBlobUtil.fs.exists(targetPath);
      if (fileExists) {
        setLocalFilePath(targetPath);
        setIsDownloading(false);
        return targetPath;
      }
      
      // Download file
      const res = await RNBlobUtil.config({
        fileCache: true,
        path: targetPath,
        addAndroidDownloads: Platform.OS === 'android' ? {
          useDownloadManager: true,
          notification: true,
          title: name,
          description: 'Downloading file',
          mime: type,
          mediaScannable: true,
        } : undefined
      })
      .fetch('GET', downloadUrl)
      .progress((received, total) => {
        // Convert string values to numbers before calculation
        const receivedNum = typeof received === 'string' ? parseFloat(received) : received;
        const totalNum = typeof total === 'string' ? parseFloat(total) : total;
        const percentage = Math.floor((receivedNum / totalNum) * 100);
        setDownloadProgress(percentage);
      });
      
      setLocalFilePath(targetPath);
      return targetPath;
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download file');
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, [downloadUrl, name, type, createDownloadDir]);
  
  // Open the file
  const openFile = React.useCallback(async (filePath: string) => {
    try {
      if (Platform.OS === 'ios') {
        await RNBlobUtil.ios.openDocument(filePath);
      } else {
        await RNBlobUtil.android.actionViewIntent(filePath, type);
      }
      
      if (onOpenComplete) {
        onOpenComplete();
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  }, [type, onOpenComplete]);
  
  // Handle download and open
  const handlePress = async () => {
    try {
      if (localFilePath && await RNBlobUtil.fs.exists(localFilePath)) {
        await openFile(localFilePath);
      } else {
        const path = await downloadFile();
        if (path) {
          await openFile(path);
        }
      }
    } catch (error) {
      console.error('Error handling file:', error);
      Alert.alert('Error', 'Failed to process file');
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={[
        styles.container,
        { borderColor: colors.border.light }
      ]}
      disabled={isDownloading}
    >
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={24} color={colors.brand.primary} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text 
          style={[styles.fileName, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        
        <Text style={[styles.fileInfo, { color: colors.text.tertiary }]}>
          {formatFileSize(size)}
        </Text>
        
        {isDownloading && (
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
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {downloadProgress}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionContainer}>
        {isDownloading ? (
          <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
            Downloading...
          </Text>
        ) : localFilePath ? (
          <Icon name="open-in-new" size={22} color={colors.brand.primary} />
        ) : (
          <Icon name="download" size={22} color={colors.brand.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
  },
}); 