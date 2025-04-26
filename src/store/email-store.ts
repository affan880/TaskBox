import { create } from 'zustand';
import { Email } from '../types/email';
import { loadCategories, loadLastSelectedCategory, saveLastSelectedCategory } from '../lib/storage/category-storage';

// Define EmailPriority enum
export enum EmailPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Define EmailFilter type
export type EmailFilter = {
  search: string;
  status: 'all' | 'read' | 'unread';
  priority: 'all' | EmailPriority;
  category?: string;  // Make category optional in the filter type
};

// Default filter
const defaultFilter: EmailFilter = {
  search: '',
  status: 'all',
  priority: 'all',
};

// API client type definitions
type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

// API client setup
const api = {
  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    // Implement actual API call
    const response: ApiResponse<T> = { data: [] as unknown as T, status: 200 };
    return response;
  },
  post: async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
    // Implement actual API call
    return { data: [] as unknown as T, status: 200 };
  },
  patch: async (url: string, data?: any): Promise<void> => {
    // Implement actual API call
  },
  delete: async (url: string): Promise<void> => {
    // Implement actual API call
  }
};

type EmailState = {
  // State
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  filter: EmailFilter | null;
  selectedCategory: string | null;
  categories: string[];
  priorityCount: Record<EmailPriority, number>;
};

type EmailActions = {
  // Actions
  fetchEmails: (filter?: EmailFilter) => Promise<void>;
  sendEmail: (emailData: Omit<Email, 'id' | 'createdAt'>) => Promise<Email>;
  markAsRead: (emailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (emailId: string) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  setFilters: (filters: Partial<EmailFilter>) => void;
  resetFilters: () => void;
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (category: string) => Promise<void>;
  sortEmails: () => void;
};

type EmailStore = EmailState & EmailActions;

// Helper function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export const useEmailStore = create<EmailStore>()((set, get) => ({
  // Initial state
  emails: [],
  isLoading: false,
  error: null,
  filter: null,
  selectedCategory: null,
  categories: [],
  priorityCount: {
    [EmailPriority.HIGH]: 0,
    [EmailPriority.MEDIUM]: 0,
    [EmailPriority.LOW]: 0,
  },

  // Actions
  fetchEmails: async (filter?: EmailFilter) => {
    set({ isLoading: true });
    try {
      const url = filter ? `/emails?${new URLSearchParams(filter as Record<string, string>)}` : '/emails';
      const response = await api.get<Email[]>(url);
      if (response?.data) {
        set({ emails: response.data, error: null });
      }
    } catch (error) {
      set({ error: 'Failed to fetch emails' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendEmail: async (emailData) => {
    set({ isLoading: true, error: null });
    try {
      const email = await api.post<Email>('/emails', emailData);
      set((state) => ({
        emails: [...state.emails, email.data],
        isLoading: false,
      }));
      return email.data;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },
  
  markAsRead: async (emailId, isRead) => {
    try {
      await api.patch(`/emails/${emailId}`, { isRead });
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === emailId ? { ...email, isRead } : email
        ),
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  
  toggleStar: async (emailId) => {
    try {
      const email = get().emails.find((e) => e.id === emailId);
      if (!email) return;
      
      await api.patch(`/emails/${emailId}/star`);
      set((state) => ({
        emails: state.emails.map((email) =>
          email.id === emailId
            ? { ...email, isStarred: !email.isStarred }
            : email
        ),
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  
  deleteEmail: async (emailId) => {
    try {
      await api.delete(`/emails/${emailId}`);
      set((state) => ({
        emails: state.emails.filter((email) => email.id !== emailId),
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  
  setFilters: (filters: Partial<EmailFilter>) => {
    set((state) => ({
      filter: { ...(state.filter ?? defaultFilter), ...filters }
    }));
  },
  
  resetFilters: () => {
    set({
      filter: defaultFilter
    });
  },
  
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await loadCategories();
      const lastSelected = await loadLastSelectedCategory('All');
      set({ categories, selectedCategory: lastSelected });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },
  
  setSelectedCategory: async (category) => {
    try {
      await saveLastSelectedCategory(category);
      set((state) => ({ 
        selectedCategory: category,
        filter: { ...(state.filter ?? defaultFilter), category }
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set category'
      });
    }
  },
  
  sortEmails: () => {
    set((state) => {
      const sortedEmails = [...state.emails].sort((a: Email, b: Email) => {
        // Sort by priority (HIGH > MEDIUM > LOW)
        const priorityOrder: Record<EmailPriority, number> = {
          [EmailPriority.HIGH]: 3,
          [EmailPriority.MEDIUM]: 2,
          [EmailPriority.LOW]: 1
        };
        
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then sort by read status (unread first)
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;

        // Finally sort by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return { emails: sortedEmails };
    });
  },
}));