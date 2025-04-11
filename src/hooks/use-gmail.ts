import { useState, useCallback } from 'react';
import * as gmailApi from '../services/gmail-api';
import { formatEmailDetails } from '../utils/email-formatter';
import { EmailData } from '../types/email';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const SNOOZED_EMAILS_KEY = '@snoozed_emails';

type SnoozeData = {
  emailId: string;
  snoozeUntil: string;
};

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
      console.log('useGmail: Calling gmailApi.listMessages', { maxResults, pageToken });
      // Step 1: Fetch list of message IDs and next page token
      const listResponse = await gmailApi.listMessages(maxResults, pageToken); 
      nextToken = listResponse.nextPageToken || null;
      const messageRefs = listResponse.messages || [];
      console.log('useGmail: listMessages response received', { 
        messageCount: messageRefs.length,
        hasNextPageToken: !!nextToken 
      });

      if (messageRefs.length > 0) {
        // Step 2: Fetch full details for each message ID
        // Use Promise.allSettled to fetch details in parallel and handle potential errors for individual emails
        console.log(`useGmail: Fetching details for ${messageRefs.length} message IDs...`);
        const detailResults = await Promise.allSettled(
          messageRefs.map((ref: { id: string }) => gmailApi.getEmailById(ref.id))
        );
        console.log(`useGmail: Details fetched for ${messageRefs.length} message IDs.`);

        // Step 3: Format successful responses
        fetchedEmails = detailResults
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              try {
                // Formatting happens here
                return formatEmailDetails(result.value);
              } catch (formatError) {
                console.error(`useGmail: Error formatting email ${messageRefs[index].id}:`, formatError);
                return null; // Skip emails that fail formatting
              }
            } else {
              console.error(`useGmail: Error fetching details for email ${messageRefs[index].id}:`, result.reason);
              return null; // Skip emails that failed to fetch
            }
          })
          .filter((email): email is EmailData => email !== null); // Filter out nulls (errors)
        
        console.log(`useGmail: Successfully formatted ${fetchedEmails.length} emails.`);

        // Update state based on pagination
        if (!pageToken) {
          console.log('useGmail: Setting emails (first page)');
          setEmails(fetchedEmails);
        } else {
          console.log('useGmail: Appending emails to existing list');
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
      console.log('useGmail: Email fetch process completed successfully');
      return { emails: fetchedEmails, nextPageToken: nextToken };

    } catch (err: any) {
      console.error('useGmail: Error during email fetch process:', err);
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
      console.log('useGmail: Load more skipped', { isLoadingMore, nextPageToken, isLoading });
      return false;
    }
    console.log('useGmail: Loading more emails...');
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
      console.log(`useGmail: Fetching details for email ${emailId}`);
      const response = await gmailApi.getEmailById(emailId); // Use the correct API function
      console.log(`useGmail: Raw details received for ${emailId}`);

      const formattedEmail = formatEmailDetails(response);
      console.log(`useGmail: Details formatted for ${emailId}`);

      setCurrentEmail(formattedEmail);
      return formattedEmail;

    } catch (err: any) {
      console.error(`useGmail: Error fetching email details for ${emailId}:`, err);
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
      console.log('useGmail: Sending email...');
      // Pass isHtml = false for now, can be parameterized if needed
      await gmailApi.sendEmail(to, subject, body, false); 
      console.log('useGmail: Email sent successfully');
      return true;
    } catch (err: any) {
      console.error('useGmail: Error sending email:', err);
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
      console.log(`useGmail: Marking email ${emailId} as read`);
      await gmailApi.markAsRead(emailId);
      console.log(`useGmail: Email ${emailId} marked as read successfully`);
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error marking email ${emailId} as read:`, err);
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
      console.log(`useGmail: Marking email ${emailId} as unread`);
      await gmailApi.markAsUnread(emailId);
      console.log(`useGmail: Email ${emailId} marked as unread successfully`);
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error marking email ${emailId} as unread:`, err);
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
      console.log(`useGmail: Archiving email ${emailId}`);
      await gmailApi.archiveEmail(emailId);
      console.log(`useGmail: Email ${emailId} archived successfully`);
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error archiving email ${emailId}:`, err);
      // Revert optimistic update on failure
      setEmails(originalEmails);
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
      console.log(`useGmail: Deleting email ${emailId}`);
      await gmailApi.deleteEmail(emailId); // Assumes this moves to trash
      console.log(`useGmail: Email ${emailId} deleted successfully`);
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error deleting email ${emailId}:`, err);
      // Revert optimistic update on failure
      setEmails(originalEmails);
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
      console.log(`useGmail: Applying labels ${labelIds.join(', ')} to email ${emailId}`);
      await gmailApi.addLabels(emailId, labelIds); // Use addLabels
      console.log(`useGmail: Labels applied successfully to ${emailId}`);
      // Optionally, update local state if labels are displayed/used
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error applying labels to ${emailId}:`, err);
      setError(err.message || 'Failed to apply labels');
      return false;
    }
  }, []);

   /**
   * Removes specific labels from an email using the API.
   */
  const removeLabel = useCallback(async (emailId: string, labelIds: string[]): Promise<boolean> => {
    try {
      console.log(`useGmail: Removing labels ${labelIds.join(', ')} from email ${emailId}`);
      await gmailApi.removeLabels(emailId, labelIds); // Use removeLabels
      console.log(`useGmail: Labels removed successfully from ${emailId}`);
      // Optionally, update local state
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error removing labels from ${emailId}:`, err);
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
      console.log(`useGmail: Snoozing email ${emailId} until ${snoozeUntil.toISOString()}`);
      // Step 1: Archive the email via API
      await gmailApi.archiveEmail(emailId); 
      console.log(`useGmail: Email ${emailId} archived as part of snooze`);

      // Step 2: Store snooze data locally
      const snoozeDataString = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      let snoozeData: SnoozeData[] = snoozeDataString ? JSON.parse(snoozeDataString) : [];
      
      const existingIndex = snoozeData.findIndex(item => item.emailId === emailId);
      const newSnoozeEntry = { emailId, snoozeUntil: snoozeUntil.toISOString() };

      if (existingIndex >= 0) {
        snoozeData[existingIndex] = newSnoozeEntry;
      } else {
        snoozeData.push(newSnoozeEntry);
      }
      
      await AsyncStorage.setItem(SNOOZED_EMAILS_KEY, JSON.stringify(snoozeData));
      console.log(`useGmail: Snooze data saved locally for ${emailId}`);
      
      return true;
    } catch (err: any) {
      console.error(`useGmail: Error snoozing email ${emailId}:`, err);
      // Revert optimistic UI update on failure
      setEmails(originalEmails);
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
      const snoozeDataString = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      if (!snoozeDataString) {
        console.log('useGmail: No snoozed emails found in storage.');
        return;
      }
      
      const snoozeData: SnoozeData[] = JSON.parse(snoozeDataString);
      const now = new Date();
      const emailsToUnsnooze: string[] = [];
      const updatedSnoozeData: SnoozeData[] = [];
      
      snoozeData.forEach(item => {
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
   * Fetches a specific attachment from an email.
   */
  const fetchAttachment = useCallback(async (messageId: string, attachmentId: string): Promise<{ data: string; mimeType: string } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`useGmail: Fetching attachment ${attachmentId} from email ${messageId}`);
      const response = await gmailApi.getAttachment(messageId, attachmentId);
      console.log(`useGmail: Attachment fetched successfully`);
      return response;
    } catch (err: any) {
      console.error(`useGmail: Error fetching attachment ${attachmentId} from email ${messageId}:`, err);
      setError(err.message || 'Failed to fetch attachment');
      return null;
    } finally {
      setIsLoading(false);
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