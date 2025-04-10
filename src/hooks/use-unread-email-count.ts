import { useState, useEffect, useRef } from 'react';
import { useEmailActions } from '../screens/email/hooks/use-email-actions';
import type { EmailData } from '../types/email';

/**
 * Hook to get the count of unread emails
 * @returns The number of unread emails
 */
export function useUnreadEmailCount(): number {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { loadEmails } = useEmailActions();
  const lastUpdateTime = useRef<number>(0);
  const initialLoadDone = useRef<boolean>(false);
  const emailsCache = useRef<EmailData[]>([]);

  useEffect(() => {
    // Function to fetch and count unread emails
    const fetchUnreadCount = async () => {
      // Implement a time check to prevent unnecessary calls
      const now = Date.now();
      // Skip if we've checked recently - 5 minutes timeout
      if (initialLoadDone.current && now - lastUpdateTime.current < 300000) { 
        return;
      }
      
      try {
        // Don't fetch on initial load - wait for data to be loaded elsewhere
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          lastUpdateTime.current = now;
          // Wait for 3 seconds to let other components load emails first
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // After waiting, check if we have emails in other parts of the app
          if (emailsCache.current.length > 0) {
            const count = emailsCache.current.filter(email => email.isUnread).length;
            setUnreadCount(count);
            return;
          }
        }
        
        // Use page 1 parameter to avoid errors
        const emails = await loadEmails(1);
        if (emails && emails.length > 0) {
          emailsCache.current = emails;
          const count = emails.filter(email => email.isUnread).length;
          setUnreadCount(count);
          lastUpdateTime.current = now;
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    // Initial fetch with a significant delay to avoid competing with other loadEmail calls
    const initialFetchTimeout = setTimeout(() => {
      fetchUnreadCount();
    }, 5000);

    // Set up an interval to periodically check for new emails, less frequently
    const intervalId = setInterval(fetchUnreadCount, 300000); // Check every 5 minutes

    // Clean up interval and timeout on unmount
    return () => {
      clearTimeout(initialFetchTimeout);
      clearInterval(intervalId);
    };
  }, [loadEmails]);

  return unreadCount;
} 