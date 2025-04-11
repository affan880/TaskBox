import { useState, useCallback, useRef, useEffect } from 'react';
import { useGmail } from '../../../hooks/use-gmail';
import { EmailData } from '../../../types/email';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // Needed for auth check

/**
 * Hook for email actions specific to the EmailScreen.
 * Manages screen-level loading states, caching, and delegates actions to useGmail.
 */
export function useEmailActions() {
  // --- State from useGmail ---
  const {
    // Data
    emails: coreEmails, // Renamed to avoid conflict
    currentEmail,
    labels,
    nextPageToken,
    // Core Loading/Error states (may not be needed directly here)
    isLoading: isGmailLoading,
    error: gmailError,
    // Actions
    fetchEmails: coreFetchEmails,
    loadMoreEmails: coreLoadMore, 
    fetchEmailById,
    sendEmail: coreSendEmail,
    markAsRead: coreMarkAsRead,
    markAsUnread: coreMarkAsUnread,
    archiveEmail: coreArchiveEmail,
    deleteEmail: coreDeleteEmail,
    fetchLabels: coreFetchLabels,
    applyLabel: coreApplyLabel,
    removeLabel: coreRemoveLabel,
    snoozeEmail: coreSnoozeEmail,
    checkSnoozedEmails,
    fetchAttachment: coreFetchAttachment,
  } = useGmail();

  // --- Screen-Specific State ---
  const [screenEmails, setScreenEmails] = useState<EmailData[]>(coreEmails);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAuthFailed, setHasAuthFailed] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const initialLoadComplete = !isGmailLoading && initialLoadAttempted;
  const isHandlingMore = useRef(false);

  // --- Refs for screen logic ---
  const currentPageToken = useRef<string | null>(null);
  const isFetching = useRef(false); // Debounce flag

  // --- Authentication Check ---
  const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signInSilently();
        console.log('useEmailActions: Signed in silently', userInfo);
        return true;
      }
      return true;
    } catch (err) {
      console.error('useEmailActions: Authentication failed:', err);
      setHasAuthFailed(true); // Set auth failed state here
      return false;
    }
  }, []);

  // --- Data Loading Logic ---

  /**
   * Loads the initial set of emails or performs a full refresh.
   * Checks auth, calls coreFetchEmails, and updates screen state.
   */
  const loadInitialEmails = useCallback(async (isRefresh = false) => {
    if (isGmailLoading && !isRefresh) {
      console.log('useEmailActions: loadInitialEmails skipped - already loading');
      return;
    }
    console.log(`useEmailActions: Triggering ${isRefresh ? 'refresh' : 'initial load'}`);
    setInitialLoadAttempted(true);
    setHasAuthFailed(false);

    try {
      if (!(await ensureAuthenticated())) {
        console.log('useEmailActions: Authentication failed');
        return;
      }
      await coreFetchEmails();
      console.log('useEmailActions: coreFetchEmails triggered');
    } catch (error) {
      console.error('useEmailActions: Error triggering initial email fetch:', error);
    } finally {
      if (isRefresh) {
        console.log('useEmailActions: Resetting isRefreshing after refresh attempt');
        setIsRefreshing(false);
      }
    }
  }, [isGmailLoading, coreFetchEmails, ensureAuthenticated]);

  /**
   * Handles pull-to-refresh action.
   */
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    console.log('useEmailActions: handleRefresh triggered');
    setIsRefreshing(true);
    currentPageToken.current = null;
    await loadInitialEmails(true);
  }, [loadInitialEmails, isRefreshing]);

  /**
   * Loads the next page of emails.
   */
  const handleLoadMore = useCallback(async () => {
    if (isGmailLoading || isHandlingMore.current || !nextPageToken) {
      console.log('useEmailActions: Load more skipped', { isGmailLoading, isHandlingMore: isHandlingMore.current, hasNextPage: !!nextPageToken });
      return;
    }
    console.log('useEmailActions: handleLoadMore triggered');
    isHandlingMore.current = true;

    try {
      if (!(await ensureAuthenticated())) {
        console.log('useEmailActions: Authentication failed during load more');
        return;
      }
      await coreLoadMore();
      console.log('useEmailActions: coreLoadMore triggered');
    } catch (error) {
      console.error('useEmailActions: Error triggering load more emails:', error);
    } finally {
      isHandlingMore.current = false;
      console.log('useEmailActions: handleLoadMore finished');
    }
  }, [isGmailLoading, nextPageToken, coreLoadMore, ensureAuthenticated]);

  // --- Delegated Actions ---
  // These functions mostly delegate to useGmail, potentially adding screen-specific logic or loading states if needed.

  const getEmailDetails = useCallback(async (emailId: string): Promise<EmailData | null> => {
    console.log(`useEmailActions: Delegating getEmailDetails for ${emailId}`);
    return fetchEmailById(emailId); 
  }, [fetchEmailById]);

  const archiveEmail = useCallback(async (emailId: string): Promise<boolean> => {
    console.log(`useEmailActions: Delegating archiveEmail for ${emailId}`);
    const success = await coreArchiveEmail(emailId);
    if (success) {
      setScreenEmails(prev => prev.filter(email => email.id !== emailId));
    }
    return success;
  }, [coreArchiveEmail]);

  const deleteEmail = useCallback(async (emailId: string): Promise<boolean> => {
     console.log(`useEmailActions: Delegating deleteEmail for ${emailId}`);
     const success = await coreDeleteEmail(emailId);
     if (success) {
        setScreenEmails(prev => prev.filter(email => email.id !== emailId));
     }
     return success;
  }, [coreDeleteEmail]);

  const markAsUnread = useCallback(async (emailId: string): Promise<boolean> => {
    console.log(`useEmailActions: Delegating markAsUnread for ${emailId}`);
    const success = await coreMarkAsUnread(emailId);
    if(success) {
        setScreenEmails(prev => 
            prev.map(email => 
                email.id === emailId ? { ...email, isUnread: true } : email
            )
        );
    }
    return success;
  }, [coreMarkAsUnread]);

  const markAsRead = useCallback(async (emailId: string): Promise<boolean> => {
    console.log(`useEmailActions: Delegating markAsRead for ${emailId}`);
    const success = await coreMarkAsRead(emailId);
     if(success) {
        setScreenEmails(prev => 
            prev.map(email => 
                email.id === emailId ? { ...email, isUnread: false } : email
            )
        );
    }
    return success;
  }, [coreMarkAsRead]);

  const applyLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    console.log(`useEmailActions: Delegating applyLabel for ${emailId}`);
    return coreApplyLabel(emailId, labelIds);
  }, [coreApplyLabel]);

  const removeLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    console.log(`useEmailActions: Delegating removeLabel for ${emailId}`);
    return coreRemoveLabel(emailId, labelIds);
  }, [coreRemoveLabel]);

  const snoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date): Promise<boolean> => {
    console.log(`useEmailActions: Delegating snoozeEmail for ${emailId}`);
    const success = await coreSnoozeEmail(emailId, snoozeUntil);
    if(success) {
        setScreenEmails(prev => prev.filter(email => email.id !== emailId));
    }
    return success;
  }, [coreSnoozeEmail]);

  const sendEmail = useCallback(async (to: string, subject: string, body: string): Promise<boolean> => {
    console.log(`useEmailActions: Delegating sendEmail`);
    const success = await coreSendEmail(to, subject, body);
    return success;
  }, [coreSendEmail]);

  /**
   * Fetches an attachment from an email.
   * @param messageId The ID of the email
   * @param attachmentId The ID of the attachment
   * @returns The attachment data and MIME type if successful, null otherwise
   */
  const fetchAttachment = useCallback(async (messageId: string, attachmentId: string) => {
    console.log(`useEmailActions: Delegating fetchAttachment for message ${messageId}, attachment ${attachmentId}`);
    return coreFetchAttachment(messageId, attachmentId);
  }, [coreFetchAttachment]);

  // --- Effects ---
  useEffect(() => {
    console.log('useEmailActions: Initial mount effect, calling loadInitialEmails');
    if (coreEmails.length === 0 && !isGmailLoading) {
        loadInitialEmails();
    }
    checkSnoozedEmails();
  }, [loadInitialEmails, checkSnoozedEmails, coreEmails.length, isGmailLoading]);

  useEffect(() => {
    setScreenEmails(coreEmails);
    console.log(`useEmailActions: Synced screenEmails with coreEmails (${coreEmails.length} items)`);
  }, [coreEmails]);

  // --- Return Values ---
  return {
    // Screen State
    emails: screenEmails,
    isLoading: isGmailLoading && !initialLoadComplete,
    isRefreshing,
    isLoadingMore: isGmailLoading && initialLoadComplete && !!nextPageToken,
    hasAuthFailed,
    initialLoadComplete,
    currentEmail,
    labels,
    gmailError,
    
    // Screen Actions
    loadInitialEmails,
    handleRefresh,
    handleLoadMore,

    // Delegated Actions (renamed for clarity)
    getEmailDetails,
    archiveEmail,
    deleteEmail,
    markAsUnread,
    markAsRead,
    applyLabel,
    removeLabel,
    snoozeEmail,
    sendEmail,
    fetchAttachment,
  };
}
