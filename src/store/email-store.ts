import { create } from 'zustand';
import { Email, EmailPriority } from '../types/email';
import { fetchEmails, sendEmail, updateEmail, deleteEmail } from '../api/gmail-api';

type EmailFilter = {
  isRead?: boolean;
  isStarred?: boolean;
  priority?: EmailPriority;
  searchText?: string;
  labels?: string[];
};

type EmailStore = {
  // State
  emails: Email[];
  isLoading: boolean;
  error: string | null;
  filters: EmailFilter;
  
  // Actions
  fetchEmails: () => Promise<void>;
  sendEmail: (emailData: Omit<Email, 'id' | 'createdAt'>) => Promise<Email>;
  markAsRead: (emailId: string, isRead: boolean) => Promise<void>;
  toggleStar: (emailId: string) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  setFilters: (filters: Partial<EmailFilter>) => void;
  resetFilters: () => void;
};

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Initial state
  emails: [],
  isLoading: false,
  error: null,
  filters: {},
  
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
      const newEmail = await sendEmail(emailData);
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
      await updateEmail(emailId, { isRead });
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
      await updateEmail(emailId, { isStarred });
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
  }
}));