import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const CATEGORY_STORAGE_KEY = '@email_categories';
const LAST_SELECTED_CATEGORY_KEY = '@last_selected_category';

// Initialize storage with fallback
let storage: MMKV | null = null;
try {
  storage = new MMKV({
    id: 'category-storage',
    encryptionKey: 'taskbox-secure-storage',
  });
} catch (error) {
  console.warn('MMKV initialization failed for categories, falling back to AsyncStorage', error);
}

/**
 * Save categories to persistent storage
 * @param categories Array of category names
 */
export async function saveCategories(categories: string[]): Promise<void> {
  try {
    const categoriesJson = JSON.stringify(categories);
    
    if (storage) {
      // Use MMKV if available (faster)
      storage.set(CATEGORY_STORAGE_KEY, categoriesJson);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, categoriesJson);
    }
  } catch (error) {
    console.error('Failed to save categories:', error);
  }
}

/**
 * Load categories from persistent storage
 * @returns Array of category names or empty array if none found
 */
export async function loadCategories(): Promise<string[]> {
  try {
    let categoriesJson: string | undefined | null;
    
    if (storage) {
      // Use MMKV if available
      categoriesJson = storage.getString(CATEGORY_STORAGE_KEY);
    } else {
      // Fallback to AsyncStorage
      categoriesJson = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
    }
    
    if (!categoriesJson) return [];
    
    return JSON.parse(categoriesJson);
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [];
  }
}

/**
 * Save the last selected category
 * @param category Selected category name
 */
export async function saveLastSelectedCategory(category: string): Promise<void> {
  try {
    if (storage) {
      storage.set(LAST_SELECTED_CATEGORY_KEY, category);
    } else {
      await AsyncStorage.setItem(LAST_SELECTED_CATEGORY_KEY, category);
    }
  } catch (error) {
    console.error('Failed to save last selected category:', error);
  }
}

/**
 * Load the last selected category
 * @param defaultCategory Default category to return if none found
 * @returns The last selected category or the default
 */
export async function loadLastSelectedCategory(defaultCategory: string = 'All'): Promise<string> {
  try {
    let category: string | undefined | null;
    
    if (storage) {
      category = storage.getString(LAST_SELECTED_CATEGORY_KEY);
    } else {
      category = await AsyncStorage.getItem(LAST_SELECTED_CATEGORY_KEY);
    }
    
    return category || defaultCategory;
  } catch (error) {
    console.error('Failed to load last selected category:', error);
    return defaultCategory;
  }
} 