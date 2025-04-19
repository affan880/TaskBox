import { useState, useCallback, useRef, useEffect } from 'react';
import { useGmail } from '../../../hooks/use-gmail';
import { EmailData } from '../../../types/email';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // Needed for auth check
// Remove gapi imports
// import { gapi } from 'gapi-script'; // Needed for types
// import type { gmail_v1 } from 'googleapis'; // Import types separately

// Import the new search function from the API layer
import * as gmailApi from '../../../api/gmail-api';

// --- Local Types for API response (simplified) ---
type MessageReference = {
  id: string;
  threadId: string;
};

type SearchResponse = {
  messages?: MessageReference[];
  nextPageToken?: string | null;
  resultSizeEstimate?: number;
};

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
  const initialLoadCompleteTimestamp = useRef(0); // Track initial load completion time

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<EmailData[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Ref for debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      initialLoadCompleteTimestamp.current = Date.now(); // Mark initial load completion time
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
    // Prevent loading more if:
    // 1. Gmail is already loading
    // 2. We're already handling a load more request
    // 3. There's no next page token
    // 4. We're showing a filtered category with no results (but only if not 'All')
    
    const isFiltering = screenEmails.length === 0 && coreEmails.length > 0;
    // Only check for filtered results if we're not showing all emails
    // This fixes load more after Smart Sort when going back to 'All'
    
    if (isGmailLoading || isHandlingMore.current || !nextPageToken || isFiltering) {
      console.log('useEmailActions: Load more skipped', { 
        isGmailLoading, 
        isHandlingMore: isHandlingMore.current, 
        hasNextPage: !!nextPageToken,
        isFiltering
      });
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
    } catch (error) {
      console.error('[useEmailActions:Error] Error triggering load more emails:', error);
    } finally {
      isHandlingMore.current = false;
      console.log('useEmailActions: handleLoadMore finished');
    }
  }, [isGmailLoading, nextPageToken, coreLoadMore, ensureAuthenticated, screenEmails.length, coreEmails.length]);

  // --- Delegated Actions ---
  // These functions mostly delegate to useGmail, potentially adding screen-specific logic or loading states if needed.

  const getEmailDetails = useCallback(async (emailId: string): Promise<EmailData | null> => {
    console.log(`[useEmailActions:Delegate] Calling fetchEmailById for ${emailId}`);
    const result = await fetchEmailById(emailId); 
    console.log(`[useEmailActions:Delegate] fetchEmailById for ${emailId} returned: ${result ? 'Success' : 'Null'}`);
    return result;
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
  const fetchAttachment = useCallback(
    async (messageId: string, attachmentId: string, filename: string, mimeType: string): Promise<{ data: string; mimeType: string } | null> => {
      console.log(`[useEmailActions:Action] Fetching attachment ${attachmentId} for message ${messageId}`);
      // Assuming coreFetchAttachment expects these 4 arguments
      return coreFetchAttachment(messageId, attachmentId, filename, mimeType); 
    },
    [coreFetchAttachment],
  );

  // Helper function for delaying execution
  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  // Define batch size for fetching email details
  const BATCH_SIZE = 5;

  // --- Search Logic --- (Refactored for Debounce)

  // Core search function - performs API call and updates results
  const performSearch = useCallback(async (query: string): Promise<void> => {
    // This function contains the logic to call gmailApi.searchMessages,
    // fetch details in batches, and update searchResults/isSearching.
    // (Code from previous correct version)
    console.log(`[useEmailActions:Search:Start] Performing search for query: "${query}"`);
    setIsSearching(true);
    setSearchResults([]); // Clear previous results before new search

    try {
      if (!(await ensureAuthenticated())) {
        console.warn('[useEmailActions:Auth] Authentication failed during search');
        setIsSearching(false);
        return;
      }

      console.log(`[useEmailActions:Search:API] Calling gmailApi.searchMessages with query: "${query}"`);
      const response: SearchResponse = await gmailApi.searchMessages(query, 50);
      const messages = response?.messages || [];
      console.log(`[useEmailActions:Search:API-Response] Found ${messages.length} message references:`, messages.map(m => m.id));

      if (messages.length === 0) {
        setSearchResults([]);
        // isSearching will be set to false in finally block
        return; // Exit early if no messages found
      }

      const allFetchedEmails: EmailData[] = [];
      console.log(`[useEmailActions:Search] Starting batch fetch for ${messages.length} emails (batch size: ${BATCH_SIZE})`);

      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batchIds = messages
          .slice(i, i + BATCH_SIZE)
          .map((message) => message.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);
        
        if (batchIds.length === 0) continue;

        console.log(`[useEmailActions:Search] Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
        
        try {
          const batchPromises = batchIds.map((id) => fetchEmailById(id));
          const batchResults = await Promise.all(batchPromises);
          const validBatchEmails = batchResults.filter((email): email is EmailData => !!email);
          allFetchedEmails.push(...validBatchEmails);
          console.log(`[useEmailActions:Search] Batch ${Math.floor(i / BATCH_SIZE) + 1} fetched ${validBatchEmails.length} valid emails.`);

          if (i + BATCH_SIZE < messages.length) {
            await delay(200);
          }
        } catch (batchError) {
          console.error(`[useEmailActions:Search] Error fetching batch starting at index ${i}:`, batchError);
        }
      }

      console.log(`[useEmailActions:Search:Result] Final processed emails (${allFetchedEmails.length}):`, allFetchedEmails.map(e => ({ id: e.id, subject: e.subject, from: e.from })));
      setSearchResults(allFetchedEmails);

    } catch (error) {
      console.error(`[useEmailActions:Search] Error searching emails for query "${query}":`, error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      console.log(`[useEmailActions:Search:Finish] Search finished for: "${query}"`);
    }
  }, [ensureAuthenticated, fetchEmailById]); // Dependencies for the API calls

  // Function to clear the search query
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Function to trigger search immediately (e.g., on submit)
  const triggerImmediateSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      console.log('[useEmailActions:ImmediateSearch] Triggering search immediately for:', trimmedQuery);
      setIsSearching(true);
      performSearch(trimmedQuery);
    } else {
      console.log('[useEmailActions:ImmediateSearch] Empty query, clearing results.');
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, performSearch]);

  // --- Effects ---
  useEffect(() => {
    // console.log('useEmailActions: Mount effect running.'); // Development only
    // Use module-level flag to prevent duplicate runs across StrictMode double-mounts
    if (!initialLoadHasRun) {
       initialLoadHasRun = true; // Set the global flag
       console.log('[useEmailActions] Triggering initial actions on first mount');
       // Reset internal completion flag before starting
       setInternalInitialLoadComplete(false); 
       initialLoadCompleteTimestamp.current = 0; // Reset timestamp
       loadInitialEmails();
       checkSnoozedEmails();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Side effect: Update screenEmails when coreEmails change
  useEffect(() => {
    setScreenEmails(coreEmails);
  }, [coreEmails]);

  // Mark as complete when isGmailLoading is false
  useEffect(() => {
    // If Gmail is done loading, and we've started the initial load process,
    // but internal complete flag isn't set yet, set it now
    if (!isGmailLoading && initialLoadStartedRef.current && !internalInitialLoadComplete) {
        setInternalInitialLoadComplete(true);
        initialLoadCompleteTimestamp.current = Date.now(); // Update timestamp
        console.log('[useEmailActions] Setting initialLoadComplete via loading state change');
    }
  }, [isGmailLoading, initialLoadStartedRef, internalInitialLoadComplete]);

  // --- Synchronization Effect ---
  // Keep screenEmails synchronized with coreEmails from useGmail
  useEffect(() => {
    // console.log('[useEmailActions] Syncing screenEmails with coreEmails');
    setScreenEmails(coreEmails);
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

    // Search related
    searchQuery,
    setSearchQuery, // Expose setter for direct input binding
    searchResults,
    isSearching,
    triggerImmediateSearch,
    clearSearch, // Keep this exposed
  };
}
