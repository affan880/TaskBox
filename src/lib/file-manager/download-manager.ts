import { Platform, Alert } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

export type DownloadOptions = {
  url: string;
  filename: string;
  mimeType?: string;
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void;
  showNotification?: boolean;
};

export type DownloadResult = {
  path: string;
  success: boolean;
  error?: string;
};

/**
 * Ensure the download directory exists
 */
async function ensureDownloadDirectoryExists(): Promise<string> {
  // Different paths for iOS and Android
  const targetDir = Platform.OS === 'ios' 
    ? `${RNBlobUtil.fs.dirs.DocumentDir}/TaskBox/Downloads`
    : `${RNBlobUtil.fs.dirs.DownloadDir}/TaskBox`;
  
  // Ensure directory exists
  const dirExists = await RNBlobUtil.fs.exists(targetDir);
  if (!dirExists) {
    await RNBlobUtil.fs.mkdir(targetDir);
  }
  
  return targetDir;
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[\/\\?%*:|"<>]/g, '_');
}

/**
 * Check if file already exists in the download directory
 */
export async function checkFileExists(filename: string): Promise<string | null> {
  const targetDir = await ensureDownloadDirectoryExists();
  const sanitizedFilename = sanitizeFilename(filename);
  const filePath = `${targetDir}/${sanitizedFilename}`;
  
  const fileExists = await RNBlobUtil.fs.exists(filePath);
  return fileExists ? filePath : null;
}

/**
 * Download a file from a URL
 */
export async function downloadFile(options: DownloadOptions): Promise<DownloadResult> {
  const { 
    url, 
    filename, 
    mimeType = 'application/octet-stream',
    headers = {},
    onProgress,
    showNotification = true
  } = options;
  
  try {
    // Sanitize filename to remove invalid characters
    const sanitizedFilename = sanitizeFilename(filename);
    
    // Ensure download directory exists
    const targetDir = await ensureDownloadDirectoryExists();
    const filePath = `${targetDir}/${sanitizedFilename}`;
    
    // Check if file already exists
    const fileExists = await RNBlobUtil.fs.exists(filePath);
    if (fileExists) {
      return { 
        path: filePath, 
        success: true 
      };
    }
    
    // Configure the download
    const task = RNBlobUtil.config({
      path: filePath,
      fileCache: true,
      addAndroidDownloads: Platform.OS === 'android' && showNotification ? {
        useDownloadManager: true,
        notification: true,
        title: filename,
        description: 'Downloading file',
        mime: mimeType,
        mediaScannable: true,
      } : undefined,
    }).fetch('GET', url, headers);
    
    // Track download progress
    if (onProgress) {
      task.progress({ interval: 250 }, (received, total) => {
        const progress = Math.round((received / total) * 100);
        onProgress(progress);
      });
    }
    
    // Wait for download to complete
    const res = await task;
    const downloadedPath = res.path();
    
    return {
      path: downloadedPath,
      success: true
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      path: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown download error'
    };
  }
}

/**
 * Open a downloaded file
 */
export async function openFile(filePath: string, mimeType: string): Promise<boolean> {
  try {
    // Ensure the file exists
    const fileExists = await RNBlobUtil.fs.exists(filePath);
    if (!fileExists) {
      throw new Error('File does not exist');
    }
    
    // Open the file with the default viewer
    if (Platform.OS === 'ios') {
      // For iOS, we use QuickLook via react-native-blob-util
      await RNBlobUtil.ios.openDocument(filePath);
    } else {
      // For Android, we can use the file path directly
      await RNBlobUtil.android.actionViewIntent(filePath, mimeType);
    }
    
    return true;
  } catch (error) {
    console.error('Error opening file:', error);
    Alert.alert('Error', 'Failed to open the file');
    return false;
  }
}

/**
 * Download with option to open when complete
 */
export async function downloadAndOpenFile(options: DownloadOptions): Promise<DownloadResult> {
  const { filename } = options;
  
  // First check if the file already exists
  const existingFilePath = await checkFileExists(filename);
  if (existingFilePath) {
    // If the file exists, ask if the user wants to open it
    Alert.alert(
      'File Already Downloaded',
      `"${filename}" is already downloaded. Do you want to open it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: async () => {
            await openFile(existingFilePath, options.mimeType || 'application/octet-stream');
          }
        }
      ]
    );
    
    return {
      path: existingFilePath,
      success: true
    };
  }
  
  // Otherwise download the file
  const result = await downloadFile(options);
  
  // If download was successful, ask if the user wants to open it
  if (result.success) {
    Alert.alert(
      'Download Complete',
      `"${filename}" has been downloaded. Do you want to open it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: async () => {
            await openFile(result.path, options.mimeType || 'application/octet-stream');
          }
        }
      ]
    );
  } else {
    Alert.alert('Download Failed', result.error || 'Failed to download the file');
  }
  
  return result;
}

/**
 * Delete a file from the download directory
 */
export async function deleteDownloadedFile(filename: string): Promise<boolean> {
  try {
    const targetDir = await ensureDownloadDirectoryExists();
    const sanitizedFilename = sanitizeFilename(filename);
    const filePath = `${targetDir}/${sanitizedFilename}`;
    
    const fileExists = await RNBlobUtil.fs.exists(filePath);
    if (fileExists) {
      await RNBlobUtil.fs.unlink(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Upload a file to a server
 */
export async function uploadFile(
  filePath: string, 
  url: string,
  formField: string = 'file',
  formData: Record<string, string> = {}, 
  headers: Record<string, string> = {},
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    // Validate file exists
    const fileExists = await RNBlobUtil.fs.exists(filePath);
    if (!fileExists) {
      throw new Error('File does not exist');
    }
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || 'file';
    
    // Prepare form data
    const formDataArray = [
      { name: formField, filename, data: RNBlobUtil.wrap(filePath) }
    ];
    
    // Add additional form fields
    Object.entries(formData).forEach(([key, value]) => {
      formDataArray.push({ name: key, filename: '', data: value });
    });
    
    // Set default content type if not provided
    const requestHeaders = {
      'Content-Type': 'multipart/form-data',
      ...headers
    };
    
    // Start upload
    const task = RNBlobUtil.fetch('POST', url, requestHeaders, formDataArray);
    
    // Track upload progress
    if (onProgress) {
      task.uploadProgress({ interval: 250 }, (written, total) => {
        const progress = Math.round((written / total) * 100);
        onProgress(progress);
      });
    }
    
    // Wait for upload to complete
    const response = await task;
    const responseData = await response.json();
    
    return {
      success: true,
      response: responseData
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
} 