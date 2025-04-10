import { useState, useCallback, useRef } from 'react';
import { useGmail } from '../../../hooks/use-gmail';
import { EmailData } from '../../../types/email';
import React from 'react';

/**
 * Hook for email actions that can be performed in the email screen
 */
export function useEmailActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasAuthFailed, setHasAuthFailed] = useState(false);
  const [hasAttemptedRealFetch, setHasAttemptedRealFetch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gmailApi = useGmail();

  const emailCache = useRef<Record<string, EmailData>>({});
  const cachedEmailsRef = useRef<Record<string, { data: EmailData[]; timestamp: number }>>({});
  const fetchedEmailIds = useRef<Set<string>>(new Set());
  const pageTokensRef = useRef<Record<string, string>>({});
  const lastLoadTimestamp = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  const ensureAuthenticated = async (): Promise<boolean> => {
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const currentUser = await GoogleSignin.getCurrentUser();

      if (!currentUser) {
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signInSilently();
        return true;
      }

      return true;
    } catch (err) {
      console.error('Authentication failed:', err);
      return false;
    }
  };

  const getCachedEmails = (key: string): EmailData[] | null => {
    const cache = cachedEmailsRef.current[key];
    if (cache && Date.now() - cache.timestamp < 60000) {
      return cache.data;
    }
    return null;
  };

  const getPageToken = (
    page: number,
    pageSize: number,
    nextPageToken: string | undefined
  ): string | undefined => {
    if (page === 1) return undefined;
    const prevKey = `${page - 1}-${pageSize}`;
    return nextPageToken || pageTokensRef.current[prevKey];
  };

  const sortEmailsByDate = useCallback((emails: EmailData[]): EmailData[] => {
    return [...emails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const archiveEmail = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmailApi.archiveEmail(emailId);
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error archiving email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmail = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmailApi.deleteEmail(emailId);
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error deleting email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsUnread = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmailApi.markAsUnread(emailId);
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error marking email as unread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyLabel = async (emailId: string, labelId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement label application once the API is available
      console.warn('Label application not implemented yet');
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error applying label:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const snoozeEmail = async (emailId: string, snoozeUntil: Date): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement snoozing logic
      console.warn('Email snoozing not implemented yet');
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error snoozing email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (to: string, subject: string, body: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmailApi.sendEmail(to, subject, body);
    } catch (error) {
      setHasAuthFailed(true);
      console.error('Error sending email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = useCallback(
    async (page = 1, pageSize = 10, forceRefresh = false): Promise<EmailData[]> => {
      const cacheKey = `${page}-${pageSize}`;
      const now = Date.now();

      if (!forceRefresh) {
        const cached = getCachedEmails(cacheKey);
        if (cached) {
          console.log(`Using cached emails for ${cacheKey}`);
          return cached;
        }
      }

      if (isLoadingRef.current || now - lastLoadTimestamp.current < 500) {
        console.log(`Debounced load for ${cacheKey}`);
        return cachedEmailsRef.current[cacheKey]?.data || [];
      }

      lastLoadTimestamp.current = now;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        if (!(await ensureAuthenticated())) {
          setHasAuthFailed(true);
          return [];
        }

        const token = getPageToken(page, pageSize, gmailApi.nextPageToken ?? undefined);
        const fetchedEmails = await gmailApi.fetchEmails(pageSize, token);
        const sorted = sortEmailsByDate(fetchedEmails);

        if (gmailApi.nextPageToken) {
          pageTokensRef.current[cacheKey] = gmailApi.nextPageToken;
        } else {
          delete pageTokensRef.current[cacheKey];
        }

        cachedEmailsRef.current[cacheKey] = { data: sorted, timestamp: now };
        sorted.forEach(email => fetchedEmailIds.current.add(email.id));

        return sorted;
      } catch (err) {
        console.error('Failed to load emails:', err);
        setHasAuthFailed(true);
        return [];
      } finally {
        setTimeout(() => {
          isLoadingRef.current = false;
          setIsLoading(false);
        }, 100);
      }
    },
    [gmailApi, sortEmailsByDate]
  );

  const getEmailDetails = useCallback(
    async (emailId: string): Promise<EmailData | null> => {
      setIsLoading(true);
      try {
        console.log('Fetching email details for ID:', emailId);
        setHasAttemptedRealFetch(true);
        const email = await gmailApi.fetchEmailById(emailId);
        return email ?? null;
      } catch (error) {
        console.error('Error fetching email details:', error);
        setHasAuthFailed(true);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [gmailApi]
  );

  const resetEmailCache = useCallback(() => {
    cachedEmailsRef.current = {};
    fetchedEmailIds.current.clear();
    console.log('Email cache reset');
  }, []);

  return {
    isLoading,
    hasAttemptedRealFetch,
    archiveEmail,
    deleteEmail,
    markAsUnread,
    applyLabel,
    snoozeEmail,
    sendEmail,
    loadEmails,
    getEmailDetails,
    resetEmailCache,
    hasAuthFailed,
  };
}
