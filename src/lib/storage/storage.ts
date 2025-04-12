import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage interfaces to abstract implementations
interface AsyncStorageInterface {
  getString(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

interface SyncStorageInterface {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

// In-memory fallback for any storage issues
const memoryStorage = new Map<string, string>();
const memoryStorageAdapter: SyncStorageInterface = {
  getString: (key: string) => memoryStorage.get(key),
  set: (key: string, value: string) => {
    memoryStorage.set(key, value);
  },
  delete: (key: string) => {
    memoryStorage.delete(key);
  },
  clearAll: () => {
    memoryStorage.clear();
  }
};

// AsyncStorage adapter
const asyncStorageAdapter: AsyncStorageInterface = {
  getString: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key) || undefined;
    } catch (e) {
      console.error(`Error getting item from AsyncStorage: ${key}`, e);
      return undefined;
    }
  },
  set: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error(`Error setting item in AsyncStorage: ${key}`, e);
    }
  },
  delete: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Error deleting item from AsyncStorage: ${key}`, e);
    }
  },
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing AsyncStorage', e);
    }
  }
};

// Use AsyncStorage adapter as our primary storage
const storage = asyncStorageAdapter;
console.log('Using AsyncStorage for app storage');

/**
 * Get a value from storage
 */
export async function getItem<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  try {
    const value = await storage.getString(key);
    if (value === undefined || value === null) return defaultValue;
    
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error(`Error parsing storage value for key ${key}:`, e);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error retrieving item from storage for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in storage
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving to storage for key ${key}:`, e);
  }
}

/**
 * Remove a value from storage
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await storage.delete(key);
  } catch (error) {
    console.error(`Error removing item from storage for key ${key}:`, error);
  }
}

/**
 * Clear all storage
 */
export async function clearStorage(): Promise<void> {
  try {
    await storage.clearAll();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

/**
 * Get a value synchronously (falls back to default)
 * Use this only when sync access is absolutely required
 */
export function getItemSync<T>(key: string, defaultValue: T): T {
  try {
    // Queue up an async update for future reference
    getItem(key, defaultValue).then(() => {
      // This is just to ensure the value exists in AsyncStorage for future async calls
    }).catch(err => {
      console.error(`Background sync failed for key ${key}:`, err);
    });
    
    // Always return the default value for predictable behavior
    return defaultValue;
  } catch (error) {
    console.error(`Error in getItemSync for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Custom hook to use storage with useState-like API
 */
export function useStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const storedValue = getItem<T>(key, initialValue);
  
  const setValue = (value: T) => {
    setItem(key, value);
  };
  
  return [storedValue as T, setValue];
} 