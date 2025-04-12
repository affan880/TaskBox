import { useState, useCallback, useRef, useEffect } from 'react';
import { useGmail } from '../../../hooks/use-gmail';
import { EmailData } from '../../../types/email';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // Needed for auth check

// Module-level flag to ensure initial load runs only once per app session, even in StrictMode
let initialLoadHasRun = false;

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
  const initialLoadStartedRef = useRef(false); // Ref to track if initial load started
  const [internalInitialLoadComplete, setInternalInitialLoadComplete] = useState(false); // Track completion

  // Derived state: Loading is true if gmail is loading AND the initial load hasn't completed internally
  const isLoading = isGmailLoading && !internalInitialLoadComplete;
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
        // console.log('useEmailActions: Signed in silently', userInfo); // Not essential
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
      // console.log('useEmailActions: loadInitialEmails skipped - already loading'); // Can be inferred
      return;
    }
    console.log(`[useEmailActions:Load] Triggering ${isRefresh ? 'refresh' : 'initial load'}`);
    // setHasAuthFailed(false); // Handled by ensureAuthenticated

    try {
      if (!(await ensureAuthenticated())) {
        console.warn('[useEmailActions:Auth] Authentication failed during load');
        return;
      }
      await coreFetchEmails();
      // console.log('useEmailActions: coreFetchEmails triggered'); // Implicit from success/error
      // Mark initial load as complete internally *after* the first fetch attempt settles
      if (!initialLoadStartedRef.current) {
          setInternalInitialLoadComplete(true); 
      }
    } catch (error) {
      console.error('useEmailActions: Error triggering initial email fetch:', error);
      // Also mark as complete on error to stop loading indicators
      if (!initialLoadStartedRef.current) {
           setInternalInitialLoadComplete(true); 
      }
    } finally {
      if (isRefresh) {
        console.log('useEmailActions: Resetting isRefreshing after refresh attempt');
        setIsRefreshing(false);
      }
    }
  }, [coreFetchEmails, ensureAuthenticated]);

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
        console.warn('[useEmailActions:Auth] Authentication failed during load more');
        return;
      }
      await coreLoadMore();
      // console.log('useEmailActions: coreLoadMore triggered'); // Implicit
    } catch (error) {
      console.error('[useEmailActions:Error] Error triggering load more emails:', error);
    } finally {
      isHandlingMore.current = false;
      console.log('useEmailActions: handleLoadMore finished');
    }
  }, [isGmailLoading, nextPageToken, coreLoadMore, ensureAuthenticated]);

  // --- Delegated Actions ---
  // These functions mostly delegate to useGmail, potentially adding screen-specific logic or loading states if needed.

  const getEmailDetails = useCallback(async (emailId: string): Promise<EmailData | null> => {
    // console.log(`useEmailActions: Delegating getEmailDetails for ${emailId}`); // Less important
    return fetchEmailById(emailId); 
  }, [fetchEmailById]);

  const archiveEmail = useCallback(async (emailId: string): Promise<boolean> => {
    console.log(`[useEmailActions:Action] Archiving email ${emailId}`);
    const success = await coreArchiveEmail(emailId);
    if (success) {
      setScreenEmails(prev => prev.filter(email => email.id !== emailId));
    }
    return success;
  }, [coreArchiveEmail]);

  const deleteEmail = useCallback(async (emailId: string): Promise<boolean> => {
     console.log(`[useEmailActions:Action] Deleting email ${emailId}`);
     const success = await coreDeleteEmail(emailId);
     if (success) {
        setScreenEmails(prev => prev.filter(email => email.id !== emailId));
     }
     return success;
  }, [coreDeleteEmail]);

  const markAsUnread = useCallback(async (emailId: string): Promise<boolean> => {
    console.log(`[useEmailActions:Action] Marking email ${emailId} as unread`);
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
    console.log(`[useEmailActions:Action] Marking email ${emailId} as read`);
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
    console.log(`[useEmailActions:Action] Applying labels to ${emailId}:`, labelIds);
    return coreApplyLabel(emailId, labelIds);
  }, [coreApplyLabel]);

  const removeLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    console.log(`[useEmailActions:Action] Removing labels from ${emailId}:`, labelIds);
    return coreRemoveLabel(emailId, labelIds);
  }, [coreRemoveLabel]);

  const snoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date): Promise<boolean> => {
    console.log(`[useEmailActions:Action] Snoozing email ${emailId} until ${snoozeUntil.toISOString()}`);
    const success = await coreSnoozeEmail(emailId, snoozeUntil);
    if(success) {
        setScreenEmails(prev => prev.filter(email => email.id !== emailId));
    }
    return success;
  }, [coreSnoozeEmail]);

  const sendEmail = useCallback(async (to: string, subject: string, body: string): Promise<boolean> => {
    console.log(`[useEmailActions:Action] Sending email to ${to}`);
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
    console.log(`[useEmailActions:Action] Fetching attachment ${attachmentId} for message ${messageId}`);
    return coreFetchAttachment(messageId, attachmentId);
  }, [coreFetchAttachment]);

  // --- Effects ---
  useEffect(() => {
    // console.log('useEmailActions: Mount effect running.'); // Development only
    // Use module-level flag to prevent duplicate runs across StrictMode double-mounts
    if (!initialLoadHasRun) {
       initialLoadHasRun = true; // Set the global flag
       console.log('[useEmailActions] Triggering initial actions on first mount');
       // Reset internal completion flag before starting
       setInternalInitialLoadComplete(false); 
       loadInitialEmails();
       checkSnoozedEmails();
    }
    // Empty dependency array ensures this runs only once per actual mount
    // The module-level flag handles the StrictMode case.
  }, []); // Empty dependency array

  useEffect(() => {
    setScreenEmails(coreEmails);
    // console.log(`useEmailActions: Synced screenEmails with coreEmails (${coreEmails.length} items)`); // Too noisy
  }, [coreEmails]);

  // --- Return Values ---
  return {
    // Screen State
    emails: screenEmails,
    isLoading: isLoading, // Use the derived isLoading state
    isRefreshing,
    isLoadingMore: isGmailLoading && internalInitialLoadComplete && !!nextPageToken, // Adjusted isLoadingMore logic
    hasAuthFailed,
    initialLoadComplete: internalInitialLoadComplete, // Use internal state
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
