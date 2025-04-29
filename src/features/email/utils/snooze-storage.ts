import { storageConfig } from '@/lib/storage/storage';

const SNOOZE_STORAGE_KEY = 'snooze-settings';

type SnoozeSettings = {
  duration: number;
  timestamp: number;
};

export async function saveSnoozeSettings(settings: SnoozeSettings): Promise<void> {
  try {
    await storageConfig.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save snooze settings:', error);
    throw error;
  }
}

export async function getSnoozeSettings(): Promise<SnoozeSettings | null> {
  try {
    const settings = await storageConfig.getItem(SNOOZE_STORAGE_KEY);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Failed to get snooze settings:', error);
    return null;
  }
}

export async function clearSnoozeSettings(): Promise<void> {
  try {
    await storageConfig.removeItem(SNOOZE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear snooze settings:', error);
    throw error;
  }
} 