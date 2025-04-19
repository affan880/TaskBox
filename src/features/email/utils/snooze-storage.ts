import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const SNOOZE_KEY_PREFIX = '@email_snooze_';

type SnoozeData = {
  emailIds: string[];
  snoozeTime: string;
  labelId: string;
};

export async function storeSnoozeData(data: SnoozeData): Promise<void> {
  const key = `${SNOOZE_KEY_PREFIX}${data.emailIds.join('_')}`;
  storage.set(key, JSON.stringify(data));
}

export async function getSnoozeData(emailIds: string[]): Promise<SnoozeData | null> {
  const key = `${SNOOZE_KEY_PREFIX}${emailIds.join('_')}`;
  const data = storage.getString(key);
  return data ? JSON.parse(data) : null;
}

export async function removeSnoozeData(emailIds: string[]): Promise<void> {
  const key = `${SNOOZE_KEY_PREFIX}${emailIds.join('_')}`;
  storage.delete(key);
}

export async function getAllSnoozedEmails(): Promise<SnoozeData[]> {
  const allKeys = storage.getAllKeys();
  const snoozeKeys = allKeys.filter(key => key.startsWith(SNOOZE_KEY_PREFIX));
  
  return snoozeKeys
    .map(key => {
      const data = storage.getString(key);
      return data ? JSON.parse(data) : null;
    })
    .filter((data): data is SnoozeData => data !== null);
} 