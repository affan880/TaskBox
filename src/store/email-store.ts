import { create } from 'zustand';
import { Email, EmailPriority } from '../types/email';
import { fetchEmails, sendEmail, updateEmail, deleteEmail } from '../api/gmail-api';
<<<<<<< HEAD
import { loadCategories, loadLastSelectedCategory, saveLastSelectedCategory } from '../lib/storage/category-storage';
import { EmailFilter } from '../utils/email-filters';
=======

type EmailFilter = {
  isRead?: boolean;
  isStarred?: boolean;
  priority?: EmailPriority;
  searchText?: string;
  labels?: string[];
};
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5

type EmailStore = {
  // State
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  filters: EmailFilter;
<<<<<<< HEAD
  categories: string[];
  selectedCategory: string;
=======
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
  
  // Actions
  fetchEmails: () => Promise<void>;
  sendEmail: (emailData: Omit<Email, 'id' | 'createdAt'>) => Promise<Email>;
  markAsRead: (emailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (emailId: string) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  setFilters: (filters: Partial<EmailFilter>) => void;
  resetFilters: () => void;
<<<<<<< HEAD
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (category: string) => Promise<void>;
=======
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
};

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Initial state
  emails: [],
  isLoading: false,
  error: null,
  filters: {},
<<<<<<< HEAD
  categories: [],
  selectedCategory: 'All',
=======
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
  
  // Actions
  fetchEmails: async () => {
    set({ isLoading: true, error: null });
    try {
      const emails = await fetchEmails();
      set({ emails, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch emails', 
        isLoading: false 
      });
    }
  },
  
  sendEmail: async (emailData) => {
    set({ isLoading: true, error: null });
    try {
<<<<<<< HEAD
      const newEmail = await sendEmail(
        emailData.recipients.map(r => r.email).join(','), 
        emailData.subject, 
        emailData.body || ''
      );
=======
      const newEmail = await sendEmail(emailData);
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
      set(state => ({ 
        emails: [newEmail, ...state.emails],
        isLoading: false 
      }));
      return newEmail;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send email', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  markAsRead: async (emailId, isRead) => {
    try {
<<<<<<< HEAD
      // Add to UNREAD label if not read, remove if read
      const addLabelIds = isRead ? [] : ['UNREAD'];
      const removeLabelIds = isRead ? ['UNREAD'] : [];
      
      await updateEmail(emailId, addLabelIds, removeLabelIds);
=======
      await updateEmail(emailId, { isRead });
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
      set(state => ({
        emails: state.emails.map(email => 
          email.id === emailId ? { ...email, isRead } : email
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update email'
      });
    }
  },
  
  toggleStar: async (emailId) => {
    const { emails } = get();
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    const isStarred = !email.isStarred;
    
    try {
<<<<<<< HEAD
      // Add to STARRED label if starred, remove if not starred
      const addLabelIds = isStarred ? ['STARRED'] : [];
      const removeLabelIds = isStarred ? [] : ['STARRED'];
      
      await updateEmail(emailId, addLabelIds, removeLabelIds);
=======
      await updateEmail(emailId, { isStarred });
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
      set(state => ({
        emails: state.emails.map(email => 
          email.id === emailId ? { ...email, isStarred } : email
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to star email'
      });
    }
  },
  
  deleteEmail: async (emailId) => {
    try {
      await deleteEmail(emailId);
      set(state => ({
        emails: state.emails.filter(email => email.id !== emailId)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete email'
      });
    }
  },
  
  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }));
  },
  
  resetFilters: () => {
    set({ filters: {} });
<<<<<<< HEAD
  },

  fetchCategories: async () => {
    try {
      const categories = await loadCategories();
      const lastSelected = await loadLastSelectedCategory('All');
      set({ categories, selectedCategory: lastSelected });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load categories'
      });
    }
  },

  setSelectedCategory: async (category) => {
    try {
      await saveLastSelectedCategory(category);
      set({ 
        selectedCategory: category,
        filters: {
          ...get().filters,
          category
        }
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set category'
      });
    }
=======
>>>>>>> a9fc4e08b4f919cea509804cb8bc2a30a54fc1b5
  }
}));