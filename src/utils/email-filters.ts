import { Email } from '@/types/email';

/**
 * Email filter criteria type
 */
export type EmailFilter = {
  isRead?: boolean;
  isStarred?: boolean;
  priority?: string;
  searchText?: string;
  labels?: string[];
  category?: string;
};

/**
 * Filters emails based on the specified filter criteria
 * @param emails List of emails to filter
 * @param filters Filter criteria
 * @returns Filtered list of emails
 */
export function filterEmails(emails: Email[], filters: EmailFilter): Email[] {
  if (!emails.length) return [];
  if (!Object.keys(filters).length) return emails;
  
  return emails.filter(email => {
    // Filter by read status
    if (filters.isRead !== undefined && email.isRead !== filters.isRead) {
      return false;
    }
    
    // Filter by starred status
    if (filters.isStarred !== undefined && email.isStarred !== filters.isStarred) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority !== undefined && email.priority !== filters.priority) {
      return false;
    }
    
    // Filter by search text (search in subject, sender name, and email)
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      const inSubject = email.subject.toLowerCase().includes(search);
      const inSender = email.sender.name.toLowerCase().includes(search) || 
                      email.sender.email.toLowerCase().includes(search);
      
      if (!inSubject && !inSender) {
        return false;
      }
    }
    
    // Filter by labels
    if (filters.labels && filters.labels.length > 0) {
      if (!email.labels.some(label => filters.labels?.includes(label))) {
        return false;
      }
    }
    
    // Filter by category
    if (filters.category && filters.category !== 'All') {
      // Check if this email has the selected category as a label
      if (!email.labels.includes(filters.category)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sorts emails by date (newest first)
 * @param emails List of emails to sort
 * @returns Sorted list of emails
 */
export function sortEmailsByDate(emails: Email[]): Email[] {
  return [...emails].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Gets all unique categories from a list of emails
 * @param emails List of emails to extract categories from
 * @returns Array of unique category names
 */
export function getEmailCategories(emails: Email[]): string[] {
  const categories = new Set<string>();
  
  emails.forEach(email => {
    email.labels.forEach(label => {
      // Filter out system labels like INBOX, STARRED, etc.
      if (!label.startsWith('SYSTEM_') && !['INBOX', 'SENT', 'TRASH', 'DRAFT', 'SPAM'].includes(label.toUpperCase())) {
        categories.add(label);
      }
    });
  });
  
  return Array.from(categories).sort();
} 