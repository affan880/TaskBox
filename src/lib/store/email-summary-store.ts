import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getItem, setItem } from '../storage/storage';

// Define the store state type
interface EmailSummaryState {
  summaries: Record<string, { summary: string; html?: string }>;
  getSummary: (emailId: string) => { summary: string; html?: string } | null;
  setSummary: (emailId: string, summary: string, html?: string) => void;
  clearSummaries: () => void;
}

/**
 * Store for caching email summaries
 * Uses MMKV persistence to maintain cache across app restarts
 */
export const useEmailSummaryStore = create<EmailSummaryState>()(
  persist(
    (set, get) => ({
      // State
      summaries: {},
      
      // Actions
      getSummary: (emailId: string) => {
        const { summaries } = get();
        return summaries[emailId] || null;
      },
      
      setSummary: (emailId: string, summary: string, html?: string) => {
        set((state) => ({
          summaries: {
            ...state.summaries,
            [emailId]: { summary, html },
          },
        }));
      },
      
      clearSummaries: () => {
        set({ summaries: {} });
      },
    }),
    {
      name: 'email-summaries', // Storage key
      storage: createJSONStorage(() => ({
        // Adapter for storage
        getItem: async (name: string): Promise<string | null> => {
          const value = await getItem<string>(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await setItem(name, JSON.parse(value));
        },
        removeItem: async (name: string): Promise<void> => {
          await setItem(name, null);
        },
      })),
    }
  )
); 