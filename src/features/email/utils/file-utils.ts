import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

/**
 * Normalizes a file URI to ensure it's correctly formatted for React Native Blob Util
 */
export function normalizeFileUri(uri: string): string {
  // On iOS, convert file URLs to paths for RNBlobUtil
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return decodeURIComponent(uri).replace('file://', '');
  }
  return uri;
}

/**
 * Creates a local copy of a file, ensuring it's accessible for upload/download operations
 */
export async function createLocalFileCopy(sourceUri: string, filename: string): Promise<string | null> {
  try {
    // Generate a unique destination path in app's cache directory
    const destPath = `${RNBlobUtil.fs.dirs.CacheDir}/${Date.now()}_${filename}`;
    
    // Normalize source URI for proper access
    const normalizedSourceUri = normalizeFileUri(sourceUri);
    
    console.log(`[FileUtils] Creating local copy: ${normalizedSourceUri} -> ${destPath}`);
    
    // Copy the file using RNBlobUtil
    await RNBlobUtil.fs.cp(normalizedSourceUri, destPath);
    
    // Verify the file was copied successfully
    const exists = await RNBlobUtil.fs.exists(destPath);
    if (!exists) {
      console.error(`[FileUtils] Copy file failed: Destination file not found: ${destPath}`);
      return null;
    }
    
    console.log(`[FileUtils] File copied successfully to: ${destPath}`);
    return destPath;
  } catch (error) {
    console.error('[FileUtils] Error creating local file copy:', error);
    return null;
  }
}

/**
 * Verifies that a file at the given URI is accessible and valid
 */
export async function verifyFileAccessible(uri: string, filename: string): Promise<boolean> {
  try {
    // Normalize the URI for proper access
    const normalizedUri = normalizeFileUri(uri);
    
    // Check if file exists
    const exists = await RNBlobUtil.fs.exists(normalizedUri);
    if (!exists) {
      console.error(`[FileUtils] File not found: ${filename} at path: ${normalizedUri}`);
      return false;
    }
    
    // Get file stats to check size and access
    const stats = await RNBlobUtil.fs.stat(normalizedUri);
    if (!stats) {
      console.error(`[FileUtils] Cannot get file stats: ${filename}`);
      return false;
    }
    
    // Check if file is empty
    if (stats.size === 0) {
      console.error(`[FileUtils] File is empty: ${filename}`);
      return false;
    }
    
    console.log(`[FileUtils] File verified: ${filename}, size: ${stats.size} bytes`);
    return true;
  } catch (error) {
    console.error(`[FileUtils] Error verifying file: ${filename}`, error);
    return false;
  }
}

/**
 * Formats file size in a user-friendly way (KB, MB, etc.)
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // Return size with one decimal place for KB and above, rounded to nearest
  return i === 0
    ? `${bytes} ${sizes[i]}`
    : `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
} 