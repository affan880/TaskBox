import { create } from 'zustand';
import { EmailData } from '@/types/email';

type EmailStore = {
  emails: EmailData[];
  selectedEmails: EmailData[];
  setEmails: (emails: EmailData[]) => void;
  setSelectedEmails: (emails: EmailData[]) => void;
  addEmail: (email: EmailData) => void;
  removeEmail: (emailId: string) => void;
};

export const useEmailStore = create<EmailStore>((set) => ({
  emails: [],
  selectedEmails: [],
  setEmails: (emails) => set({ emails }),
  setSelectedEmails: (emails) => set({ selectedEmails: emails }),
  addEmail: (email) => set((state) => ({ emails: [...state.emails, email] })),
  removeEmail: (emailId) => set((state) => ({
    emails: state.emails.filter((email) => email.id !== emailId)
  })),
})); 