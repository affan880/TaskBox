import { useState, useCallback, useEffect } from 'react';
import * as gmailApi from 'src/api/gmail-api';
import { formatEmailDetails } from 'src/lib/utils/email-formatter';
import { EmailData, SnoozeData } from 'src/types/email';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from 'src/lib/auth/auth-provider';
import { Alert } from 'react-native';

// Keys for AsyncStorage
const SNOOZED_EMAILS_KEY = '@snoozed_emails';

// --- Types ---
// Basic structure for Gmail API Message Part
type GmailMessagePartBody = {
  attachmentId?: string;
  size: number;
  data?: string; // Base64 encoded data
};

type GmailMessagePart = {
  partId: string;
  mimeType: string;
  filename: string;
  headers: Array<{ name: string; value: string }>;
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
};

// Type for the attachment data we expect back from our fetch function
export type FetchedAttachmentData = {
  data: string; // Base64 encoded data
  filename: string;
  mimeType: string;
  size: number;
};

/**
 * Core hook for interacting with the Gmail API and managing email state.
 */
export function useGmail() {
  const { isLoggedIn, isTokenExpired, handleTokenRefresh, signOut, accessToken } = useAuth();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingAttachment, setLoadingAttachment] = useState<Record<string, boolean>>({});
  const [errorAttachment, setErrorAttachment] = useState<Record<string, string | null>>({});
  
  // --- Core Data Fetching ---

  /**
   * Fetches a list of email IDs using listMessages, then fetches details for each ID.
   * Updates the email list state and handles pagination.
   */
  const fetchEmails = useCallback(async (maxResults = 20, pageToken?: string): Promise<{ emails: EmailData[], nextPageToken: string | null }> => {
    const loadingSetter = pageToken ? setIsLoadingMore : setIsLoading;
    loadingSetter(true);
    setError(null);
    
    let fetchedEmails: EmailData[] = [];
    let nextToken: string | null = null;

    try {
      // Use the new optimized listEmailsWithContent function to get emails in batch
      console.log('[useGmail:Fetch] Fetching emails with content in batch...');
      const { emails: batchedEmails, nextPageToken: newNextPageToken } = 
        await gmailApi.listEmailsWithContent(maxResults, pageToken);
      
      nextToken = newNextPageToken || null;
      
      // Convert API EmailData to our frontend EmailData type
      fetchedEmails = batchedEmails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        from: email.from,
        to: email.to,
        subject: email.subject,
        snippet: email.snippet,
        body: email.body,
        date: email.date instanceof Date ? email.date.toISOString() : String(email.date), // Convert Date to string
        isUnread: email.isUnread ?? false,
        hasAttachments: false, // Default value
        attachments: [], // Default value
        labelIds: [], // Default value
        internalDate: String(Date.now()) // Default value using current timestamp
      }));
      
      console.log(`[useGmail:Fetch] Successfully loaded ${fetchedEmails.length} emails in batch.`);

      // Update state based on pagination
      if (!pageToken) {
        setEmails(fetchedEmails);
      } else {
        // Subsequent pages (load more)
        setEmails(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          // Filter out duplicates *within* the new batch first
          const uniqueNewEmails = fetchedEmails.reduce((acc, current) => {
            if (!acc.some(item => item.id === current.id)) {
              acc.push(current);
            }
            return acc;
          }, [] as EmailData[]);
          
          // Then filter against existing emails
          const emailsToAdd = uniqueNewEmails.filter(e => !existingIds.has(e.id));
          
          if (emailsToAdd.length > 0) {
            return [...prev, ...emailsToAdd];
          } else {
            // Avoid unnecessary state update if no new unique emails were found
            return prev;
          }
        });
      }
      
      setNextPageToken(nextToken);
      return { emails: fetchedEmails, nextPageToken: nextToken };

    } catch (err: any) {
      console.error('[useGmail:Error] Email fetch process failed:', err);
      setError(err.message || 'Failed to load emails');
      if (!pageToken) setEmails([]); // Clear emails on error for the first page
      return { emails: [], nextPageToken: null }; // Return empty state on error
    } finally {
      loadingSetter(false);
    }
  }, []); // Dependency: formatEmailDetails implicitly used

  /**
   * Loads the next page of emails using the stored nextPageToken.
   */
  const loadMoreEmails = useCallback(async (): Promise<boolean> => {
    if (isLoadingMore || !nextPageToken || isLoading) {
      // console.log('useGmail: Load more skipped', { isLoadingMore, nextPageToken, isLoading }); // Too noisy
      return false;
    }
    console.log('[useGmail:Load] Loading more emails...');
    const { emails: newEmails } = await fetchEmails(20, nextPageToken);
    return newEmails.length > 0; // Indicate success if new emails were loaded
  }, [nextPageToken, isLoadingMore, isLoading, fetchEmails]); // Dependency: fetchEmails

  /**
   * Fetches the details for a single email by its ID, formats it,
   * and sets it as the current email.
   */
  const fetchEmailById = useCallback(async (emailId: string): Promise<EmailData | null> => {
    console.log(`[useGmail:Fetch:Start] fetchEmailById for ${emailId}`); // Log Start
    setIsLoading(true); // Use main loading state for fetching details
    setError(null);
    setCurrentEmail(null); // Clear previous email while loading
    
    try {
      console.log(`[useGmail:Fetch] Fetching details for email ${emailId} using cache-first approach`);
      
      // Use the new cached version to avoid duplicate API calls
      const apiEmailData = await gmailApi.getCachedEmailById(emailId);
      
      // Convert to our frontend EmailData type
      const emailData: EmailData = {
        id: apiEmailData.id,
        threadId: apiEmailData.threadId,
        from: apiEmailData.from,
        to: apiEmailData.to,
        subject: apiEmailData.subject,
        snippet: apiEmailData.snippet,
        body: apiEmailData.body,
        date: apiEmailData.date instanceof Date ? apiEmailData.date.toISOString() : String(apiEmailData.date),
        isUnread: apiEmailData.isUnread ?? false,
        hasAttachments: false,
        attachments: [],
        labelIds: [],
        internalDate: String(Date.now())
      };
      
      console.log(`[useGmail:Fetch:Success] fetchEmailById for ${emailId}`); // Log Success
      setCurrentEmail(emailData);
      return emailData;

    } catch (err: any) {
      console.error(`[useGmail:Error] Failed fetching details for email ${emailId}:`, err);
      setError(err.message || 'Failed to load email details');
      console.log(`[useGmail:Fetch:Error] fetchEmailById for ${emailId}`); // Log Error
      return null;
    } finally {
      setIsLoading(false);
      console.log(`[useGmail:Fetch:Finally] fetchEmailById for ${emailId}`); // Log Finally
    }
  }, []); // Dependencies: none

  // --- Email Actions ---

  /**
   * Sends an email using the Gmail API.
   */
  const sendEmail = useCallback(async (
    to: string, 
    subject: string, 
    body: string, 
    attachments: any[] = [],
    originalHtml?: string
  ): Promise<boolean> => {
    setIsLoading(true); // Indicate loading state
    setError(null);
    
    try {
      await gmailApi.sendEmail(to, subject, body, attachments, originalHtml); 
      return true;
    } catch (err: any) {
      console.error('[useGmail:Error] Failed sending email:', err);
      setError(err.message || 'Failed to send email');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Marks an email as read both in the API and updates local state.
   */
  const markAsRead = useCallback(async (emailId: string): Promise<boolean> => {
    // Optimistic UI update
    setEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId ? { ...email, isUnread: false } : email
      )
    );
    if (currentEmail?.id === emailId) {
      setCurrentEmail(prev => prev ? { ...prev, isUnread: false } : null);
    }

    try {
      // console.log(`useGmail: Marking email ${emailId} as read`); // Redundant
      await gmailApi.markAsRead(emailId);
      // console.log(`useGmail: Email ${emailId} marked as read successfully`); // Logged by action hook
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed marking email ${emailId} as read:`, err);
      // Revert optimistic update on failure
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId ? { ...email, isUnread: true } : email
        )
      );
      if (currentEmail?.id === emailId) {
        setCurrentEmail(prev => prev ? { ...prev, isUnread: true } : null);
      }
      setError(err.message || 'Failed to mark email as read');
      return false;
    }
  }, [currentEmail]); // Dependency: currentEmail for optimistic update

  /**
   * Marks an email as unread both in the API and updates local state.
   */
  const markAsUnread = useCallback(async (emailId: string): Promise<boolean> => {
    // Optimistic UI update
    setEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId ? { ...email, isUnread: true } : email
      )
    );
     if (currentEmail?.id === emailId) {
      setCurrentEmail(prev => prev ? { ...prev, isUnread: true } : null);
    }

    try {
      // console.log(`useGmail: Marking email ${emailId} as unread`); // Redundant
      await gmailApi.markAsUnread(emailId);
      // console.log(`useGmail: Email ${emailId} marked as unread successfully`); // Logged by action hook
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed marking email ${emailId} as unread:`, err);
      // Revert optimistic update on failure
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId ? { ...email, isUnread: false } : email
        )
      );
       if (currentEmail?.id === emailId) {
        setCurrentEmail(prev => prev ? { ...prev, isUnread: false } : null);
      }
      setError(err.message || 'Failed to mark email as unread');
      return false;
    }
  }, [currentEmail]); // Dependency: currentEmail for optimistic update

  /**
   * Archives an email both in the API and removes it from the local list.
   */
  const archiveEmail = useCallback(async (emailId: string): Promise<boolean> => {
    // Optimistic UI update
    const originalEmails = emails;
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));

    try {
      // console.log(`useGmail: Archiving email ${emailId}`); // Redundant
      await gmailApi.archiveEmail(emailId);
      // Remove locally after successful API call
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      // console.log(`useGmail: Email ${emailId} archived successfully`); // Logged by action hook
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed archiving email ${emailId}:`, err);
      setError(err.message || 'Failed to archive email');
      return false;
    }
  }, [emails]); // Dependency: emails for optimistic update

  /**
   * Moves an email to trash both in the API and removes it from the local list.
   */
  const deleteEmail = useCallback(async (emailId: string): Promise<boolean> => {
    // Optimistic UI update
    const originalEmails = emails;
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));

    try {
      // console.log(`useGmail: Deleting email ${emailId}`); // Redundant
      await gmailApi.deleteEmail(emailId);
      // Remove locally after successful API call
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      // console.log(`useGmail: Email ${emailId} deleted successfully`); // Logged by action hook
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed deleting email ${emailId}:`, err);
      setError(err.message || 'Failed to delete email');
      return false;
    }
  }, [emails]); // Dependency: emails for optimistic update

  /**
   * Fetches the list of Gmail labels.
   */
  const fetchLabels = useCallback(async (): Promise<any[]> => { // Consider defining Label type
    setIsLoading(true);
    setError(null);
    try {
      console.log('useGmail: Fetching labels...');
      const response = await gmailApi.getLabels();
      const fetchedLabels = response.labels || [];
      setLabels(fetchedLabels);
      console.log(`useGmail: Fetched ${fetchedLabels.length} labels`);
      return fetchedLabels;
    } catch (err: any) {
      console.error('useGmail: Error fetching labels:', err);
      setError(err.message || 'Failed to fetch labels');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Applies specific labels to an email using the API.
   * Note: No local state update for labels shown on list items currently.
   */
  const applyLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    // API function expects labelIds array
    try {
      // console.log(`[useGmail] Applying labels ${labelIds.join(', ')} to email ${emailId}`); // Redundant
      await gmailApi.addLabels(emailId, labelIds);
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed applying labels to email ${emailId}:`, err);
      setError(err.message || 'Failed to apply labels');
      return false;
    }
  }, []);

   /**
   * Removes specific labels from an email using the API.
   */
  const removeLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    try {
      // console.log(`[useGmail] Removing labels ${labelIds.join(', ')} from email ${emailId}`); // Redundant
      await gmailApi.removeLabels(emailId, labelIds);
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed removing labels from email ${emailId}:`, err);
      setError(err.message || 'Failed to remove labels');
      return false;
    }
  }, []);


  // --- Snooze Logic (Custom Implementation) ---

  /**
   * Snoozes an email: archives it via API and stores snooze info locally.
   */
  const snoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date): Promise<boolean> => {
    // Optimistic UI update (remove from list)
    const originalEmails = emails;
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));

    try {
      // console.log(`[useGmail] Snoozing email ${emailId} until ${snoozeUntil}`); // Redundant
      await gmailApi.snoozeEmail(emailId, snoozeUntil);
      // Store snooze info locally
      console.log(`[useGmail:Action] Storing snooze info locally for ${emailId}`);
      const snoozedEmails = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      const currentSnoozed: SnoozeData[] = snoozedEmails ? JSON.parse(snoozedEmails) : [];
      
      const existingIndex = currentSnoozed.findIndex((item: SnoozeData) => item.emailId === emailId);
      const newSnoozeEntry = { emailId, snoozeUntil: snoozeUntil.toISOString() };

      if (existingIndex >= 0) {
        currentSnoozed[existingIndex] = newSnoozeEntry;
      } else {
        currentSnoozed.push(newSnoozeEntry);
      }
      
      await AsyncStorage.setItem(SNOOZED_EMAILS_KEY, JSON.stringify(currentSnoozed));
      console.log(`[useGmail:Action] Snooze data saved locally for ${emailId}`);
      
      return true;
    } catch (err: any) {
      console.error(`[useGmail:Error] Failed snoozing email ${emailId}:`, err);
      setError(err.message || 'Failed to snooze email');
      return false;
    }
  }, [emails]); // Dependency: emails for optimistic update

  /**
   * Checks locally stored snoozed emails and unsnoozes them via API if time is up.
   */
  const checkSnoozedEmails = useCallback(async (): Promise<void> => {
    console.log('useGmail: Checking for snoozed emails...');
    try {
      const snoozedJson = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      if (!snoozedJson) {
        // console.log('[useGmail:Snooze] No snoozed emails found in storage.'); // Too noisy
        return;
      }
      
      const snoozedData: SnoozeData[] = JSON.parse(snoozedJson);
      const now = new Date();
      const emailsToUnsnooze: string[] = [];
      const updatedSnoozeData: SnoozeData[] = [];
      
      snoozedData.forEach((item: SnoozeData) => {
        const snoozeUntil = new Date(item.snoozeUntil);
        if (snoozeUntil <= now) {
          emailsToUnsnooze.push(item.emailId);
        } else {
          updatedSnoozeData.push(item);
        }
      });
      
      if (emailsToUnsnooze.length > 0) {
        console.log(`useGmail: Found ${emailsToUnsnooze.length} emails to unsnooze.`);
        // Attempt to unsnooze each via API (add INBOX label)
        // Use Promise.allSettled to handle individual failures without stopping others
        const results = await Promise.allSettled(
          emailsToUnsnooze.map(emailId => gmailApi.addLabels(emailId, ['INBOX']))
        );

        results.forEach((result, index) => {
          const emailId = emailsToUnsnooze[index];
          if (result.status === 'fulfilled') {
            console.log(`useGmail: Successfully unsnoozed email ${emailId}`);
          } else {
            console.error(`useGmail: Failed to unsnooze email ${emailId}:`, result.reason);
            // Keep the failed email in the updatedSnoozeData so we can retry later?
            // Or maybe just log the error. For now, we'll remove it from snooze list anyway.
          }
        });

        // Update storage with remaining/failed snoozed emails
        await AsyncStorage.setItem(SNOOZED_EMAILS_KEY, JSON.stringify(updatedSnoozeData));
        console.log('useGmail: Updated snoozed email storage.');

        // Refresh the primary email list to potentially show unsnoozed emails
        console.log('useGmail: Refreshing email list after checking snooze.');
        fetchEmails(); // Re-fetch the first page
      } else {
        console.log('useGmail: No emails due for unsnoozing.');
      }
    } catch (error) {
      console.error('useGmail: Error checking snoozed emails:', error);
      // Avoid setting global error state for this background task
    }
  }, [fetchEmails]); // Dependency: fetchEmails to refresh list

  /**
   * Fetches only the base64 data for a specific attachment.
   */
  const downloadAttachmentData = useCallback(
    async (
      messageId: string,
      attachmentId: string
    ): Promise<{ data: string; size: number } | null> => {
      console.log(
        `[useGmail:Download] Fetching data for attachment ${attachmentId} in message ${messageId}`
      );
      // --- Token Check/Refresh Logic --- 
      let currentToken = accessToken; 
      if (!currentToken) {
        console.warn('[useGmail:Download] Token missing. Attempting refresh.');
        const refreshed = await handleTokenRefresh();
        if (!refreshed) {
          console.error('[useGmail:Download] Token refresh failed.');
          Alert.alert('Error', 'Session expired. Please sign in again.');
          return null;
        }
        currentToken = refreshed; 
        console.log('[useGmail:Download] Token refreshed successfully.');
      } else {
        // console.log('[useGmail:Download] Valid token found.'); // Optional log
      }

      // Ensure we have a token after potential refresh
      if (!currentToken) {
        console.error('[useGmail:Download] No valid token available after check/refresh.');
        Alert.alert('Error', 'Authentication token is missing.');
        return null;
      }
      // --- End Token Check ---
      
      try {
        // Use currentToken for the API call (assuming gmailApi.getAttachment uses the latest token implicitly or needs it passed)
        // Note: The current gmailApi.getAttachment doesn't take token, relying on the internal makeGmailApiRequest
        // which calls getAccessToken(). This structure should be fine.
        const attachmentData = await gmailApi.getAttachment(messageId, attachmentId);
        if (!attachmentData?.data) {
          console.warn(`[useGmail:Download] No data returned for attachment ${attachmentId}`);
          return null;
        }
        console.log(
          `[useGmail:Download] Successfully fetched attachment data for ${attachmentId}. Size: ${attachmentData.size}`
        );
        return { data: attachmentData.data, size: attachmentData.size };
      } catch (error: any) {
        console.error(
          `[useGmail:Download] Error fetching attachment data for ${attachmentId}:`, error
        );
        Alert.alert('Error', `Failed to fetch attachment data: ${error.message || 'Unknown error'}`);
        return null;
      }
    },
    [accessToken, handleTokenRefresh] // Add handleTokenRefresh dependency
  );

  return {
    // State
    emails,
    currentEmail,
    isLoading,
    error,
    labels,
    nextPageToken,
    isLoadingMore,
    loadingAttachment,
    errorAttachment,
    
    // Actions
    fetchEmails,
    loadMoreEmails,
    fetchEmailById,
    sendEmail,
    markAsRead,
    markAsUnread,
    archiveEmail,
    deleteEmail,
    fetchLabels,
    applyLabel,
    removeLabel,
    snoozeEmail,
    checkSnoozedEmails,
    fetchAttachment: async (
      _messageId: string, // Placeholder
      _attachmentId: string, // Placeholder
      _filename: string, // Placeholder
      _mimeType: string // Placeholder
    ): Promise<FetchedAttachmentData | null> => { 
      console.warn("Attempted to call deprecated fetchAttachment"); 
      return null; 
    },
    downloadAttachmentData, // Expose the new function
  };
} 