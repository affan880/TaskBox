import { useState } from 'react';
import {
  downloadFile,
  downloadAndOpenFile,
  openFile,
  deleteDownloadedFile,
  uploadFile,
  checkFileExists,
  DownloadOptions
} from './download-manager';

type FileManagerHookResult = {
  // Download functions
  download: (options: DownloadOptions) => Promise<string>;
  downloadAndOpen: (options: DownloadOptions) => Promise<string>;
  openDownloadedFile: (filePath: string, mimeType: string) => Promise<boolean>;
  deleteFile: (filename: string) => Promise<boolean>;
  checkIfFileExists: (filename: string) => Promise<string | null>;

  // Upload functions
  upload: (
    filePath: string,
    url: string,
    formField?: string,
    formData?: Record<string, string>,
    headers?: Record<string, string>
  ) => Promise<any>;

  // State
  progress: number;
  isLoading: boolean;
  error: string | null;
};

export function useFileManager(): FileManagerHookResult {
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Download a file
   */
  const download = async (options: DownloadOptions): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use our progress callback to update state
      const downloadOptions = {
        ...options,
        onProgress: (p: number) => {
          setProgress(p);
          // Call the original onProgress if provided
          options.onProgress?.(p);
        }
      };
      
      const result = await downloadFile(downloadOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }
      
      setIsLoading(false);
      return result.path;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Download and offer to open a file
   */
  const downloadAndOpen = async (options: DownloadOptions): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use our progress callback to update state
      const downloadOptions = {
        ...options,
        onProgress: (p: number) => {
          setProgress(p);
          // Call the original onProgress if provided
          options.onProgress?.(p);
        }
      };
      
      const result = await downloadAndOpenFile(downloadOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }
      
      setIsLoading(false);
      return result.path;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Open a downloaded file
   */
  const openDownloadedFile = async (filePath: string, mimeType: string): Promise<boolean> => {
    try {
      setError(null);
      return await openFile(filePath, mimeType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  };

  /**
   * Delete a downloaded file
   */
  const deleteFile = async (filename: string): Promise<boolean> => {
    try {
      setError(null);
      return await deleteDownloadedFile(filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  };

  /**
   * Check if a file exists
   */
  const checkIfFileExists = async (filename: string): Promise<string | null> => {
    try {
      setError(null);
      return await checkFileExists(filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Upload a file
   */
  const upload = async (
    filePath: string,
    url: string,
    formField: string = 'file',
    formData: Record<string, string> = {},
    headers: Record<string, string> = {}
  ): Promise<any> => {
    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);
      
      const result = await uploadFile(
        filePath,
        url,
        formField,
        formData,
        headers,
        (p: number) => setProgress(p)
      );
      
      setIsLoading(false);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return result.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    download,
    downloadAndOpen,
    openDownloadedFile,
    deleteFile,
    checkIfFileExists,
    upload,
    progress,
    isLoading,
    error
  };
} 