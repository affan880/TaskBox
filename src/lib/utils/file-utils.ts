import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import type { Attachment } from '@/types';

/**
 * Normalizes file URIs for consistent handling across platforms
 */
export function normalizeFileUri(uri: string): string {
  // Handle content:// URIs on Android
  if (uri.startsWith('content://')) {
    return uri;
  }
  
  // Handle file:// URIs
  if (uri.startsWith('file://')) {
    // On iOS, remove the 'file://' prefix for RNFetchBlob
    if (Platform.OS === 'ios') {
      return uri.replace('file://', '');
    }
    return uri;
  }
  
  // If it's already a raw path, return as is
  return uri;
}

/**
 * Creates a local copy of a file in the app's storage
 */
export async function createLocalFileCopy(sourceUri: string, filename: string): Promise<string | null> {
  try {
    // Ensure filename is properly sanitized
    const sanitizedFilename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
    
    // Create app-specific storage location
    const targetDir = `${RNBlobUtil.fs.dirs.DocumentDir}/EmailAttachments`;
    
    // Ensure directory exists
    const dirExists = await RNBlobUtil.fs.exists(targetDir);
    if (!dirExists) {
      await RNBlobUtil.fs.mkdir(targetDir);
    }
    
    // Create target path with timestamp to avoid conflicts
    const timestamp = Date.now();
    const targetPath = `${targetDir}/${timestamp}-${sanitizedFilename}`;
    
    // Normalize source URI
    const normalizedSourceUri = normalizeFileUri(sourceUri);
    
    // Check if source file exists
    const sourceExists = await RNBlobUtil.fs.exists(normalizedSourceUri);
    if (!sourceExists) {
      console.error(`Source file does not exist: ${normalizedSourceUri} (original: ${sourceUri})`);
      return null;
    }
    
    // Copy file to secure location
    await RNBlobUtil.fs.cp(normalizedSourceUri, targetPath);
    
    // Verify copy succeeded
    const targetExists = await RNBlobUtil.fs.exists(targetPath);
    if (!targetExists) {
      console.error(`Failed to copy file to ${targetPath}`);
      return null;
    }
    
    return targetPath;
  } catch (error) {
    console.error('Error creating local file copy:', error);
    return null;
  }
}

/**
 * Verifies that a file at the given URI is accessible and valid
 */
export async function verifyFileAccessible(uri: string, filename: string): Promise<boolean> {
  try {
    const normalizedUri = normalizeFileUri(uri);
    
    // Check if file exists
    const exists = await RNBlobUtil.fs.exists(normalizedUri);
    if (!exists) {
      console.error(`File does not exist: ${normalizedUri} (${filename})`);
      return false;
    }
    
    // Check if we can read file stats
    try {
      const stat = await RNBlobUtil.fs.stat(normalizedUri);
      
      // Verify file is not empty
      if (stat.size === 0) {
        console.error(`File is empty: ${normalizedUri} (${filename})`);
        return false;
      }
      
      // Verify file is accessible by trying to read first bytes
      await RNBlobUtil.fs.readFile(normalizedUri, 'base64', 1024);
      
      return true;
    } catch (readError) {
      console.error(`File not readable: ${normalizedUri} (${filename})`, readError);
      return false;
    }
  } catch (error) {
    console.error(`Error verifying file: ${filename}`, error);
    return false;
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Gets appropriate icon name for file type
 */
export function getFileIcon(type: string): string {
  if (type.includes('image')) return 'image';
  if (type.includes('pdf')) return 'picture-as-pdf';
  if (type.includes('word') || type.includes('document')) return 'description';
  if (type.includes('excel') || type.includes('sheet')) return 'table-chart';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
  if (type.includes('text')) return 'text-snippet';
  if (type.includes('zip') || type.includes('compressed')) return 'archive';
  return 'insert-drive-file';
}

/**
 * Deletes a file at the given URI
 */
export async function deleteFile(uri: string): Promise<boolean> {
  try {
    const normalizedUri = normalizeFileUri(uri);
    const exists = await RNBlobUtil.fs.exists(normalizedUri);
    
    if (exists) {
      await RNBlobUtil.fs.unlink(normalizedUri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export async function downloadAttachment(attachment: Attachment): Promise<void> {
  try {
    const { uri } = attachment;
    const response = await RNBlobUtil.config({
      fileCache: true,
      appendExt: attachment.type.split('/')[1],
    }).fetch('GET', uri);

    const filePath = response.path();
    console.log('File downloaded to:', filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

export async function uploadAttachment(filePath: string, info: Record<string, any> = {}): Promise<void> {
  try {
    await RNBlobUtil.fetch(
      'POST',
      'YOUR_UPLOAD_ENDPOINT',
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        { name: 'file', filename: filePath.split('/').pop(), data: RNBlobUtil.wrap(filePath) },
        { name: 'info', data: JSON.stringify(info) },
      ]
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    txt: 'text/plain',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
} 