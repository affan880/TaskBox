import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage with fallback handling
let storage: MMKV | null = null;
let isRemoteDebugging = false;

try {
  storage = new MMKV({
    id: 'app-storage',
    encryptionKey: 'taskbox-secure-storage',
  });
} catch (error) {
  console.warn('MMKV initialization failed, falling back to AsyncStorage', error);
  isRemoteDebugging = true;
}

// Export the singleton instance
export const mmkvInstance = storage;

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

// MMKV adapter for sync storage
const mmkvStorageAdapter: SyncStorageInterface = {
  getString: (key: string) => storage?.getString(key),
  set: (key: string, value: string) => {
    storage?.set(key, value);
  },
  delete: (key: string) => {
    storage?.delete(key);
  },
  clearAll: () => {
    storage?.clearAll();
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

// Use appropriate storage adapter based on MMKV availability
const syncStorage = storage ? mmkvStorageAdapter : memoryStorageAdapter;
const asyncStorage = asyncStorageAdapter;

console.log(`Using ${storage ? 'MMKV' : 'Memory'} for app sync storage and AsyncStorage for async storage`);

// Export storage configuration for Zustand
export const storageConfig = {
  getItem: async (name: string) => {
    try {
      if (isRemoteDebugging) {
        const value = await AsyncStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      }
      const value = storage?.getString(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to get item from storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: any) => {
    try {
      if (isRemoteDebugging) {
        await AsyncStorage.setItem(name, JSON.stringify(value));
        return;
      }
      storage?.set(name, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to set item in storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      if (isRemoteDebugging) {
        await AsyncStorage.removeItem(name);
        return;
      }
      storage?.delete(name);
    } catch (error) {
      console.warn('Failed to remove item from storage:', error);
    }
  }
};

/**
 * Get a value from storage
 */
export async function getItem<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  try {
    // Try first from sync storage (MMKV)
    let value = syncStorage.getString(key);
    
    // If not found, try from async storage (AsyncStorage)
    if (value === undefined) {
      value = await asyncStorage.getString(key);
      
      // If found in async storage but not in sync storage, cache it for future sync access
      if (value !== undefined) {
        syncStorage.set(key, value);
      }
    }
    
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
    const stringValue = JSON.stringify(value);
    // Store in both sync and async storage
    syncStorage.set(key, stringValue);
    await asyncStorage.set(key, stringValue);
  } catch (e) {
    console.error(`Error saving to storage for key ${key}:`, e);
  }
}

/**
 * Remove a value from storage
 */
export async function removeItem(key: string): Promise<void> {
  try {
    syncStorage.delete(key);
    await asyncStorage.delete(key);
  } catch (error) {
    console.error(`Error removing item from storage for key ${key}:`, error);
  }
}

/**
 * Clear all storage
 */
export async function clearStorage(): Promise<void> {
  try {
    syncStorage.clearAll();
    await asyncStorage.clearAll();
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
    // Try to get the value from sync storage
    const value = syncStorage.getString(key);
    
    if (value === undefined || value === null) {
      // Queue up an async update for future reference
      getItem(key, defaultValue).then(() => {
        // This is just to ensure the value exists in AsyncStorage for future async calls
      }).catch(err => {
        console.error(`Background sync failed for key ${key}:`, err);
      });
      
      return defaultValue;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error(`Error parsing sync storage value for key ${key}:`, e);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error in getItemSync for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a value synchronously
 */
export function setItemSync<T>(key: string, value: T): void {
  try {
    const stringValue = JSON.stringify(value);
    syncStorage.set(key, stringValue);
    
    // Queue up an async update
    asyncStorage.set(key, stringValue).catch(err => {
      console.error(`Background async set failed for key ${key}:`, err);
    });
  } catch (e) {
    console.error(`Error in setItemSync for key ${key}:`, e);
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