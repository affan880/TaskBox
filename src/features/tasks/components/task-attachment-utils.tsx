import * as React from 'react';
import { Alert, Platform } from 'react-native';
import { TaskAttachment } from '@/types/task';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import * as DocumentPicker from '@react-native-documents/picker';
import { useStorage } from '@/lib/storage/use-storage';

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get appropriate icon for file type
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
 * Open a file using the device's default viewer
 */
export async function openFile(uri: string, mimeType: string): Promise<void> {
  try {
    const normalizedUri = normalizeFileUri(uri);
    
    if (Platform.OS === 'ios') {
      await RNBlobUtil.ios.openDocument(normalizedUri);
    } else {
      await RNBlobUtil.android.actionViewIntent(normalizedUri, mimeType);
    }
  } catch (error) {
    console.error('Error opening file:', error);
    Alert.alert('Error', 'Failed to open file');
    throw error;
  }
}

/**
 * Creates a local copy of a file, ensuring it's accessible for upload/download operations
 */
async function createLocalFileCopy(sourceUri: string, filename: string): Promise<string | null> {
  try {
    // Ensure filename is properly sanitized
    const sanitizedFilename = filename.replace(/[\/\\?%*:|"<>]/g, '_');
    
    // Create app-specific storage location
    const targetDir = `${RNBlobUtil.fs.dirs.DocumentDir}/TaskBox/TempAttachments`;
    
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
      console.error(`Source file does not exist: ${normalizedSourceUri}`);
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
 * Hook to manage task attachments
 */
export function useTaskAttachments(initialAttachments: TaskAttachment[] = []) {
  const [attachments, setAttachments] = React.useState<TaskAttachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentUploadId, setCurrentUploadId] = React.useState<string | null>(null);
  const { uploadFile, deleteFile, progress: uploadProgress } = useStorage();
  
  /**
   * Pick and upload attachment files
   */
  const handleAddAttachment = React.useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });
      
      setIsUploading(true);
      
      const newAttachments: TaskAttachment[] = [];
      
      for (const file of results) {
        const attachmentId = `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentUploadId(attachmentId);
        
        // Add placeholder attachment while uploading
        const tempAttachment: TaskAttachment = {
          id: attachmentId,
          name: file.name || 'Unnamed file',
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          size: file.size || 0,
          createdAt: new Date().toISOString(),
          downloadUrl: '',
          isUploading: true,
        };
        
        setAttachments(prev => [...prev, tempAttachment]);
        
        // Create a local copy to ensure reliable access
        const localFilePath = await createLocalFileCopy(file.uri, file.name || 'unnamed_file');
        
        if (!localFilePath) {
          // Failed to create local copy
          setAttachments(prev => prev.filter(a => a.id !== attachmentId));
          Alert.alert('Upload Failed', `Could not access file "${file.name}"`);
          continue;
        }
        
        // Upload to Firebase Storage using the local copy
        const storagePath = `tasks/attachments/${attachmentId}/${file.name}`;
        const downloadURL = await uploadFile(localFilePath, storagePath);
        
        if (downloadURL) {
          // Update the attachment with the download URL and local URI
          const updatedAttachment: TaskAttachment = {
            ...tempAttachment,
            uri: localFilePath, // Use the local copy path for future access
            downloadUrl: downloadURL,
            isUploading: false,
          };
          
          // Replace the placeholder with the updated attachment
          setAttachments(prev => 
            prev.map(a => a.id === attachmentId ? updatedAttachment : a)
          );
          
          newAttachments.push(updatedAttachment);
        } else {
          // Remove the placeholder if upload failed
          setAttachments(prev => prev.filter(a => a.id !== attachmentId));
          Alert.alert('Upload Failed', `Failed to upload ${file.name}`);
        }
      }
      
      setCurrentUploadId(null);
      setIsUploading(false);
    } catch (err: unknown) {
      const { errorCodes } = DocumentPicker;
      if (err instanceof Error && 'code' in err && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled the picker
      } else {
        Alert.alert('Error', 'Failed to pick document');
        console.error('Document picker error:', err);
      }
      setIsUploading(false);
      setCurrentUploadId(null);
    }
  }, [uploadFile]);
  
  /**
   * Remove an attachment
   */
  const handleRemoveAttachment = React.useCallback(async (attachmentId: string) => {
    const attachmentToRemove = attachments.find(a => a.id === attachmentId);
    
    // If the attachment is currently uploading, we can't delete it from storage yet
    if (attachmentToRemove?.isUploading) {
      setAttachments(attachments.filter(a => a.id !== attachmentId));
      return;
    }
    
    // If the attachment has a downloadUrl, delete it from Firebase Storage
    if (attachmentToRemove?.downloadUrl) {
      try {
        // Extract the storage path from the download URL
        const storagePathMatch = attachmentToRemove.downloadUrl.match(/\/o\/(.*?)\?/);
        if (storagePathMatch && storagePathMatch[1]) {
          const storagePath = decodeURIComponent(storagePathMatch[1]);
          const isDeleted = await deleteFile(storagePath);
          
          if (!isDeleted) {
            console.error(`Failed to delete attachment ${attachmentId} from storage`);
            // Continue with UI removal even if storage deletion fails
          }
        }
      } catch (error) {
        console.error('Error deleting attachment from storage:', error);
        // Continue with UI removal even if storage deletion fails
      }
    }
    
    // Try to delete the local file if it exists
    if (attachmentToRemove?.uri) {
      try {
        const normalizedUri = normalizeFileUri(attachmentToRemove.uri);
        const fileExists = await RNBlobUtil.fs.exists(normalizedUri);
        if (fileExists) {
          await RNBlobUtil.fs.unlink(normalizedUri);
        }
      } catch (error) {
        console.error('Error deleting local attachment file:', error);
      }
    }
    
    // Remove from the local state
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, [attachments, deleteFile]);
  
  /**
   * View/open an attachment
   */
  const handleViewAttachment = React.useCallback(async (attachment: TaskAttachment) => {
    try {
      // If we have a local URI, use it
      if (attachment.uri) {
        await openFile(attachment.uri, attachment.type);
        return;
      }
      
      // If has downloadUrl but no local URI, we need to download it first
      if (attachment.downloadUrl) {
        Alert.alert('Download Required', 'This file needs to be downloaded before viewing.');
      } else {
        Alert.alert('Error', 'Unable to open attachment. The file might be missing or deleted.');
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      Alert.alert('Error Opening File', 'There was an error opening this file.');
    }
  }, []);
  
  return {
    attachments,
    setAttachments,
    isUploading,
    currentUploadId,
    uploadProgress,
    handleAddAttachment,
    handleRemoveAttachment,
    handleViewAttachment
  };
} 