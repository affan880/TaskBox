import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmailData } from 'src/types/email';

// Storage keys
const EMAIL_CACHE_KEY = '@email_cache';
const EMAIL_CACHE_TIMESTAMP_KEY = '@email_cache_timestamp';
const EMAIL_CACHE_IDS_KEY = '@email_cache_ids';

// Cache expiration (12 hours in milliseconds)
const CACHE_EXPIRATION = 12 * 60 * 60 * 1000;

// Initialize storage with fallback
let storage: MMKV | null = null;
try {
  storage = new MMKV({
    id: 'email-cache',
    encryptionKey: 'taskbox-secure-storage',
  });
} catch (error) {
  console.warn('MMKV initialization failed for email cache, falling back to AsyncStorage', error);
}

/**
 * Save emails to cache
 * @param emails Array of email data
 * @param category Category these emails belong to
 */
export async function cacheEmails(emails: EmailData[], category: string = 'All'): Promise<void> {
  try {
    // Create a unique key for this category
    const cacheKey = `${EMAIL_CACHE_KEY}_${category}`;
    const emailsJson = JSON.stringify(emails);
    
    if (storage) {
      // Use MMKV if available (faster)
      storage.set(cacheKey, emailsJson);
      storage.set(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`, Date.now().toString());
      
      // Store email IDs separately for quick lookup
      const emailIds = emails.map(email => email.id);
      storage.set(`${EMAIL_CACHE_IDS_KEY}_${category}`, JSON.stringify(emailIds));
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(cacheKey, emailsJson);
      await AsyncStorage.setItem(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`, Date.now().toString());
      
      // Store email IDs separately for quick lookup
      const emailIds = emails.map(email => email.id);
      await AsyncStorage.setItem(`${EMAIL_CACHE_IDS_KEY}_${category}`, JSON.stringify(emailIds));
    }
  } catch (error) {
    console.error('Failed to cache emails:', error);
  }
}

/**
 * Load emails from cache
 * @param category Category to load emails for
 * @returns Array of cached emails or empty array if none found
 */
export async function loadCachedEmails(category: string = 'All'): Promise<EmailData[]> {
  try {
    const cacheKey = `${EMAIL_CACHE_KEY}_${category}`;
    let emailsJson: string | undefined | null;
    let timestampStr: string | undefined | null;
    
    if (storage) {
      // Use MMKV if available
      emailsJson = storage.getString(cacheKey);
      timestampStr = storage.getString(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`);
    } else {
      // Fallback to AsyncStorage
      emailsJson = await AsyncStorage.getItem(cacheKey);
      timestampStr = await AsyncStorage.getItem(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`);
    }
    
    // Check if cache exists and is not expired
    if (!emailsJson || !timestampStr) return [];
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRATION) {
      console.log('Email cache expired, returning empty array');
      return [];
    }
    
    return JSON.parse(emailsJson);
  } catch (error) {
    console.error('Failed to load cached emails:', error);
    return [];
  }
}

/**
 * Get the timestamp of the last cache update
 * @param category Category to check timestamp for
 * @returns Timestamp of the last cache update or 0 if none found
 */
export async function getLastCacheTimestamp(category: string = 'All'): Promise<number> {
  try {
    let timestampStr: string | undefined | null;
    
    if (storage) {
      timestampStr = storage.getString(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`);
    } else {
      timestampStr = await AsyncStorage.getItem(`${EMAIL_CACHE_TIMESTAMP_KEY}_${category}`);
    }
    
    return timestampStr ? parseInt(timestampStr, 10) : 0;
  } catch (error) {
    console.error('Failed to get cache timestamp:', error);
    return 0;
  }
}

/**
 * Merge new emails with cached emails, avoiding duplicates
 * @param cachedEmails Existing cached emails
 * @param newEmails New emails to merge
 * @returns Merged array with duplicates removed
 */
export function mergeEmailsWithCache(cachedEmails: EmailData[], newEmails: EmailData[]): EmailData[] {
  // Create a map of existing emails by ID for quick lookup
  const emailMap = new Map<string, EmailData>();
  
  // Add cached emails to the map
  cachedEmails.forEach(email => {
    emailMap.set(email.id, email);
  });
  
  // Add or replace with new emails
  newEmails.forEach(email => {
    emailMap.set(email.id, email);
  });
  
  // Convert map back to array and sort by date (newest first)
  return Array.from(emailMap.values()).sort((a, b) => {
    // Parse date strings to timestamp numbers for comparison
    const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : b.date;
    
    return dateB - dateA;
  });
}

/**
 * Check if an email exists in the cache
 * @param emailId Email ID to check
 * @param category Category to check in
 * @returns True if the email exists in the cache
 */
export async function isEmailInCache(emailId: string, category: string = 'All'): Promise<boolean> {
  try {
    let emailIdsJson: string | undefined | null;
    
    if (storage) {
      emailIdsJson = storage.getString(`${EMAIL_CACHE_IDS_KEY}_${category}`);
    } else {
      emailIdsJson = await AsyncStorage.getItem(`${EMAIL_CACHE_IDS_KEY}_${category}`);
    }
    
    if (!emailIdsJson) return false;
    
    const emailIds: string[] = JSON.parse(emailIdsJson);
    return emailIds.includes(emailId);
  } catch (error) {
    console.error('Failed to check if email is in cache:', error);
    return false;
  }
}

/**
 * Clear all email caches
 */
export async function clearAllEmailCaches(): Promise<void> {
  try {
    if (storage) {
      // Get all keys in storage
      const allKeys = storage.getAllKeys();
      
      // Delete all email cache related keys
      allKeys.forEach(key => {
        if (key.startsWith(EMAIL_CACHE_KEY) || 
            key.startsWith(EMAIL_CACHE_TIMESTAMP_KEY) || 
            key.startsWith(EMAIL_CACHE_IDS_KEY)) {
          storage?.delete(key);
        }
      });
    } else {
      // Get all keys in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter out email cache related keys
      const cacheKeys = allKeys.filter(key => 
        key.startsWith(EMAIL_CACHE_KEY) || 
        key.startsWith(EMAIL_CACHE_TIMESTAMP_KEY) || 
        key.startsWith(EMAIL_CACHE_IDS_KEY)
      );
      
      // Delete all email cache related keys
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    }
    
    console.log('All email caches cleared');
  } catch (error) {
    console.error('Failed to clear email caches:', error);
  }
} 