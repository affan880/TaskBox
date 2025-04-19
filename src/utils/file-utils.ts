/**
 * Utility functions for file operations
 */
import RNBlobUtil from 'react-native-blob-util';
import { Platform, Alert } from 'react-native';
import { getFileIconByType } from './validation';
import { formatFileSize } from './formatting';

/**
 * Download a file to the device
 * @param url URL of the file to download
 * @param filename Name to save the file as
 * @param mimeType MIME type of the file
 * @returns Promise resolving to the local file path
 */
export async function downloadFile(
  url: string, 
  filename: string, 
  mimeType: string
): Promise<string> {
  try {
    // Get file extension from MIME type
    const fileExt = mimeType.split('/')[1] || 'file';
    
    const config = {
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: filename,
        description: 'Downloading file',
        mime: mimeType,
        mediaScannable: true,
      },
      path: `${RNBlobUtil.fs.dirs.DocumentDir}/${filename}.${fileExt}`,
    };
    
    const response = await RNBlobUtil.config(config).fetch('GET', url);
    return response.path();
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Open a file with the default app
 * @param filePath Path to the file to open
 * @param mimeType MIME type of the file
 */
export async function openFile(filePath: string, mimeType: string): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await RNBlobUtil.ios.openDocument(filePath);
    } else {
      // Use actionViewIntent for Android - this is the correct API
      await RNBlobUtil.android.actionViewIntent(filePath, mimeType);
    }
  } catch (error) {
    console.error('Error opening file:', error);
    Alert.alert(
      'Error Opening File',
      'There was an error opening this file. Please make sure you have an app installed that can view this type of file.'
    );
  }
}

/**
 * Share a file with other apps
 * @param filePath Path to the file to share
 * @param mimeType MIME type of the file
 */
export async function shareFile(filePath: string, mimeType: string): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await RNBlobUtil.ios.previewDocument(filePath);
    } else {
      await RNBlobUtil.android.actionViewIntent(filePath, mimeType);
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    Alert.alert(
      'Error Sharing File',
      'There was an error sharing this file.'
    );
  }
}

/**
 * Generate a unique filename
 * @param originalName Original file name
 * @returns Unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop() || '';
  
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
} 