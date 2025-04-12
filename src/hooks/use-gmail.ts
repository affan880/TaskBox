import { useState, useCallback } from 'react';
import * as gmailApi from '../services/gmail-api';
import { formatEmailDetails } from '../utils/email-formatter';
import { EmailData, SnoozeData } from '../types/email';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const SNOOZED_EMAILS_KEY = '@snoozed_emails';

/**
 * Core hook for interacting with the Gmail API and managing email state.
 */
export function useGmail() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
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
      // console.log('useGmail: Calling gmailApi.listMessages', { maxResults, pageToken }); // Redundant, logged by action hook
      // Step 1: Fetch list of message IDs and next page token
      const listResponse = await gmailApi.listMessages(maxResults, pageToken); 
      nextToken = listResponse.nextPageToken || null;
      const messageRefs = listResponse.messages || [];
      console.log('[useGmail:Fetch] listMessages response received', { 
        messageCount: messageRefs.length,
        hasNextPageToken: !!nextToken 
      });

      if (messageRefs.length > 0) {
        // Step 2: Fetch full details for each message ID
        console.log(`[useGmail:Fetch] Fetching details for ${messageRefs.length} message IDs...`);
        const detailResults = await Promise.allSettled(
          messageRefs.map((ref: { id: string }) => gmailApi.getEmailById(ref.id))
        );
        console.log(`[useGmail:Fetch] Details fetched for ${messageRefs.length} message IDs.`);

        // Step 3: Format successful responses
        fetchedEmails = detailResults
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              try {
                // Formatting happens here
                return formatEmailDetails(result.value);
              } catch (formatError) {
                console.error(`[useGmail:Error] Error formatting email ${messageRefs[index].id}:`, formatError);
                return null; // Skip emails that fail formatting
              }
            } else {
              console.error(`[useGmail:Error] Failed fetching details for email ${messageRefs[index].id}:`, result.reason);
              return null; // Skip emails that failed to fetch
            }
          })
          .filter((email): email is EmailData => email !== null); // Filter out nulls (errors)
        
        console.log(`[useGmail:Fetch] Successfully formatted ${fetchedEmails.length} emails.`);

        // Update state based on pagination
        if (!pageToken) {
          // console.log('useGmail: Setting emails (first page)'); // Less important
          setEmails(fetchedEmails);
        } else {
          // console.log('useGmail: Appending emails to existing list'); // Less important
          setEmails(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const newEmails = fetchedEmails.filter(e => !existingIds.has(e.id));
            return [...prev, ...newEmails];
          });
        }
      } else {
         // No messages found for this page
         if (!pageToken) setEmails([]); // Clear emails if it was the first page
      }
      
      setNextPageToken(nextToken);
      // console.log('useGmail: Email fetch process completed successfully'); // Can be inferred
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
    setIsLoading(true); // Use main loading state for fetching details
    setError(null);
    setCurrentEmail(null); // Clear previous email while loading
    
    try {
      console.log(`[useGmail:Fetch] Fetching details for single email ${emailId}`);
      const response = await gmailApi.getEmailById(emailId); // Use the correct API function
      // console.log(`[useGmail:Fetch] Raw details received for ${emailId}`); // Too verbose

      const formattedEmail = formatEmailDetails(response);
      // console.log(`[useGmail:Fetch] Details formatted for ${emailId}`); // Too verbose

      setCurrentEmail(formattedEmail);
      return formattedEmail;

    } catch (err: any) {
      console.error(`[useGmail:Error] Failed fetching details for email ${emailId}:`, err);
      setError(err.message || 'Failed to load email details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: formatEmailDetails implicitly used

  // --- Email Actions ---

  /**
   * Sends an email using the Gmail API.
   */
  const sendEmail = useCallback(async (to: string, subject: string, body: string): Promise<boolean> => {
    setIsLoading(true); // Indicate loading state
    setError(null);
    
    try {
      // console.log('useGmail: Sending email...'); // Redundant
      // Pass isHtml = false for now, can be parameterized if needed
      await gmailApi.sendEmail(to, subject, body, false); 
      // console.log('useGmail: Email sent successfully'); // Logged by API layer
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
   * Fetches an email attachment.
   */
  const fetchAttachment = useCallback(async (messageId: string, attachmentId: string): Promise<string | null> => {
    try {
      console.log(`[useGmail:Fetch] Getting email ${messageId} to fetch attachment ${attachmentId}`);
      // First, fetch the full email details
      const emailDetails = await gmailApi.getEmailById(messageId); 

      // Find the specific part corresponding to the attachment
      const part = findAttachmentPart(emailDetails?.payload, attachmentId);

      if (!part?.body?.attachmentId) {
        console.warn(`[useGmail:Fetch] Attachment part ${attachmentId} not found in email ${messageId}`);
        return null;
      }

      // Now fetch the attachment data using the attachment ID from the part
      console.log(`[useGmail:Fetch] Fetching attachment data for ID ${part.body.attachmentId}`);
      const attachmentData = await gmailApi.getAttachment(messageId, part.body.attachmentId);
      
      if (!attachmentData?.data) {
         console.warn(`[useGmail:Fetch] Attachment data not found for attachment ID ${part.body.attachmentId}`);
         return null;
      }
      
      // Return the base64 encoded data (caller can decide how to handle/decode)
      return attachmentData.data; 

    } catch (err: any) {
      console.error(`[useGmail:Error] Failed fetching attachment ${attachmentId} for message ${messageId}:`, err);
      setError(err.message || 'Failed to fetch attachment');
      return null;
    }
  }, []);

  return {
    // State
    emails,
    currentEmail,
    isLoading,
    error,
    labels,
    nextPageToken,
    isLoadingMore,
    
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
    fetchAttachment,
  };
} 

// --- Helper function to find attachment part (needs refinement based on actual payload structure) ---
// Placeholder implementation
function findAttachmentPart(payload: any, attachmentId: string): any | null {
  if (!payload) return null;

  if (payload.parts) {
    for (const part of payload.parts) {
      // Check if the part itself is the attachment
      if (part.body?.attachmentId === attachmentId) {
        return part;
      }
      // Recursively search in nested parts
      const found = findAttachmentPart(part, attachmentId);
      if (found) return found;
    }
  }
  // Check the main body if no parts or not found in parts
  if (payload.body?.attachmentId === attachmentId) {
    return payload;
  }
  
  return null; // Not found
} 