import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create MMKV instance with error handling
let storage: MMKV;
let isRemoteDebugging = false;

try {
  storage = new MMKV();
} catch (error) {
  console.warn('Failed to initialize MMKV, using AsyncStorage fallback:', error);
  isRemoteDebugging = true;
}

export const storageConfig = {
  getItem: async (name: string) => {
    try {
      if (isRemoteDebugging) {
        const value = await AsyncStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      }
      const value = storage.getString(name);
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
      storage.set(name, JSON.stringify(value));
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
      storage.delete(name);
    } catch (error) {
      console.warn('Failed to remove item from storage:', error);
    }
  },
}; 