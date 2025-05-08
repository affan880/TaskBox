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

/**
 * Comprehensive storage cleanup function that handles all storage types
 */
export async function clearAllStorage(): Promise<void> {
  try {
    // Clear MMKV storage if available
    if (storage) {
      storage.clearAll();
    }

    // Clear AsyncStorage
    await AsyncStorage.clear();

    // Clear memory storage
    memoryStorage.clear();

    // Clear all known storage keys
    const allStorageKeys = [
      // Task related
      'task-storage',
      'task-cache',
      'task-metadata',
      
      // Project related
      'project-storage',
      'project-cache',
      'project-metadata',
      
      // Email related
      'email-storage',
      'email-summaries',
      'email_categories',
      'snoozed_emails',
      'email_priority',
      'email_filters',
      'email_settings',
      'email_sync_status',
      'email_cache',
      'email_metadata',
      'categorized_emails',
      'email_categories_cache',
      
      // Auth related
      'auth-storage',
      'auth-token',
      'auth-refresh-token',
      
      // App related
      'settings-storage',
      'theme-storage',
      'notification-storage',
      'user-preferences',
      'app-settings',
      'last-sync-time',
      'cached-data',
      'offline-data',
      'temp-storage',
      
      // Auto categorization
      'auto-categorization-cache',
      'auto-categorization-settings',
      'auto-categorization-metadata',
      'categorized_emails_cache',
      'email_category_counts',
      'last_email_analysis_time',
      '@email_categories',
      '@last_selected_category',
      
      // Additional keys that might be missed
      'mmkv_storage',
      'app-storage',
      'category-storage',
      'email-cache',
      'snooze-settings',
      'user-settings',
      'app-config',
      'last-sync',
      'offline-queue',
      'pending-changes',
      'sync-status',
      'user-preferences',
      'app-state',
      'navigation-state',
      'form-data',
      'draft-data',
      'search-history',
      'recent-items',
      'favorites',
      'bookmarks',
      'notifications',
      'permissions',
      'analytics',
      'error-logs',
      'debug-logs',
      'performance-metrics',
      'crash-reports',
      'user-feedback',
      'survey-responses',
      'tutorial-progress',
      'onboarding-state',
      'feature-flags',
      'ab-testing',
      'user-segments',
      'custom-data',
      'export-data',
      'import-data',
      'backup-data',
      'restore-points',
      'sync-tokens',
      'refresh-tokens',
      'access-tokens',
      'session-data',
      'user-session',
      'app-session',
      'device-info',
      'network-status',
      'location-data',
      'geofence-data',
      'push-tokens',
      'device-tokens',
      'fcm-tokens',
      'apns-tokens',
      'notification-settings',
      'sound-settings',
      'vibration-settings',
      'display-settings',
      'accessibility-settings',
      'language-settings',
      'timezone-settings',
      'currency-settings',
      'measurement-settings',
      'date-format-settings',
      'time-format-settings',
      'number-format-settings',
      'keyboard-settings',
      'input-settings',
      'gesture-settings',
      'animation-settings',
      'theme-settings',
      'color-settings',
      'font-settings',
      'size-settings',
      'spacing-settings',
      'layout-settings',
      'position-settings',
      'alignment-settings',
      'order-settings',
      'sort-settings',
      'filter-settings',
      'view-settings',
      'display-settings',
      'visibility-settings',
      'privacy-settings',
      'security-settings',
      'permission-settings',
      'notification-preferences',
      'email-preferences',
      'sms-preferences',
      'push-preferences',
      'in-app-preferences',
      'sound-preferences',
      'vibration-preferences',
      'display-preferences',
      'accessibility-preferences',
      'language-preferences',
      'timezone-preferences',
      'currency-preferences',
      'measurement-preferences',
      'date-format-preferences',
      'time-format-preferences',
      'number-format-preferences',
      'keyboard-preferences',
      'input-preferences',
      'gesture-preferences',
      'animation-preferences',
      'theme-preferences',
      'color-preferences',
      'font-preferences',
      'size-preferences',
      'spacing-preferences',
      'layout-preferences',
      'position-preferences',
      'alignment-preferences',
      'order-preferences',
      'sort-preferences',
      'filter-preferences',
      'view-preferences',
      'display-preferences',
      'visibility-preferences',
      'privacy-preferences',
      'security-preferences',
      'permission-preferences'
    ];

    // Remove all storage items
    for (const key of allStorageKeys) {
      try {
        await storageConfig.removeItem(key);
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove storage key ${key}:`, error);
      }
    }

    console.log('All storage cleared successfully');
  } catch (error) {
    console.error('Error clearing all storage:', error);
    throw error;
  }
} 