import { useState } from 'react';
import storage from '@react-native-firebase/storage';
import { useAuthStore } from 'src/store/auth-store';

type StorageHookResult = {
  uploadFile: (filePath: string, storagePath: string) => Promise<string | null>;
  downloadUrl: (storagePath: string) => Promise<string | null>;
  deleteFile: (storagePath: string) => Promise<boolean>;
  progress: number;
  isLoading: boolean;
  error: string | null;
};

export function useStorage(): StorageHookResult {
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);

  const uploadFile = async (filePath: string, storagePath: string): Promise<string | null> => {
    if (!user) {
      setError('User must be authenticated to upload files');
      return null;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);

      // Create a storage reference
      const userStoragePath = `users/${user.uid}/${storagePath}`;
      const reference = storage().ref(userStoragePath);

      // Start upload and track progress
      const task = reference.putFile(filePath);
      
      task.on('state_changed', (taskSnapshot) => {
        const percentage = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        setProgress(percentage);
      });

      // Wait for upload to complete
      await task;
      
      // Get download URL
      const downloadURL = await reference.getDownloadURL();
      
      setIsLoading(false);
      return downloadURL;
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      return null;
    }
  };

  const downloadUrl = async (storagePath: string): Promise<string | null> => {
    if (!user) {
      setError('User must be authenticated to get download URLs');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userStoragePath = `users/${user.uid}/${storagePath}`;
      const url = await storage().ref(userStoragePath).getDownloadURL();
      
      setIsLoading(false);
      return url;
    } catch (err) {
      setError(`Failed to get download URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      return null;
    }
  };

  const deleteFile = async (storagePath: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to delete files');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userStoragePath = `users/${user.uid}/${storagePath}`;
      await storage().ref(userStoragePath).delete();
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      return false;
    }
  };

  return { uploadFile, downloadUrl, deleteFile, progress, isLoading, error };
} 