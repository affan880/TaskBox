import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Define email data type
// email.ts
export type EmailData = {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  isUnread?: boolean;
};

// Base URL for Gmail API
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// --- Token Refresh Synchronization ---
let tokenRetrievalPromise: Promise<string> | null = null;

/**
 * Helper function to get a fresh access token, ensuring only one retrieval/refresh happens at a time.
 */
async function getAccessToken(): Promise<string> {
  // If a retrieval/refresh is already in progress, wait for it
  if (tokenRetrievalPromise) {
    console.log('[gmailApi:Auth] Token retrieval/refresh in progress, waiting...');
    try {
      return await tokenRetrievalPromise;
    } catch (waitError) {
      console.error('[gmailApi:Auth] Waiting for token retrieval/refresh failed:', waitError);
      // Rethrow so the caller knows the token fetch failed
      throw new Error('Failed to get access token while waiting for ongoing retrieval.'); 
    }
  }

  // --- Critical Section: Start Token Retrieval/Refresh ---
  // console.log('[gmailApi:Auth] Initiating token retrieval/refresh process...'); // Less noisy
  tokenRetrievalPromise = (async (): Promise<string> => {
    try {
      // Attempt to get tokens silently first
      let tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        // console.log('[gmailApi:Auth] Got valid token silently.'); // Removed for less noise
        return tokens.accessToken;
      }
      // If silent fails, initiate sign-in/refresh
      console.log('[gmailApi:Auth] Silent token retrieval failed or token missing, attempting sign-in/refresh...');
      await GoogleSignin.signInSilently(); // Or potentially signIn() if needed
      tokens = await GoogleSignin.getTokens();
      if (!tokens.accessToken) {
        throw new Error('Token refresh failed to produce an access token.');
      }
      console.log('[gmailApi:Auth] Token refresh successful.');
      return tokens.accessToken;
    } catch (error: any) {
       // Check for the specific Android native error and provide a clearer message
      if (error.message?.includes('Callback.invoke') && error.message?.includes('null object reference')) {
         console.error('[gmailApi:Auth:Error] Caught Android Native Callback Error during getTokens/signInSilently:', error);
         throw new Error('Native Google Sign-In error (Android Callback). Please try again or restart the app.');
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        console.warn('[gmailApi:Auth] Google Sign-In required.');
        // Depending on app flow, you might trigger a full interactive sign-in here
        // For now, just rethrow a specific error
        throw new Error('User sign-in required.');
      } else {
        console.error('[gmailApi:Auth:Error] Error during token retrieval/refresh process:', error);
        throw error; // Propagate other errors
      }
    } finally {
      // --- End Critical Section ---
      tokenRetrievalPromise = null; // Clear the promise once settled
      // console.log('[gmailApi:Auth] Token retrieval/refresh lock released.'); // Less noisy
    }
  })();

  return tokenRetrievalPromise;
  // --- End Critical Section ---
}

/**
 * Helper function to make authenticated requests to the Gmail API
 */
async function makeGmailApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: object
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gmail API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`[gmailApi:Error] API request failed for ${method} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get a list of email message IDs and thread IDs from the user's inbox
 * @param maxResults Maximum number of messages to return
 * @param pageToken Token for the next page of results
 * @param labelIds Array of label IDs to filter by (e.g., 'INBOX', 'UNREAD')
 */
export async function listMessages(maxResults: number = 20, pageToken?: string, labelIds: string[] = ['INBOX']): Promise<any> {
  const queryParams = new URLSearchParams({
    maxResults: maxResults.toString(),
    labelIds: labelIds.join(','),
  });
  if (pageToken) {
    queryParams.append('pageToken', pageToken);
  }
  
  // Fetches only message IDs and thread IDs, along with nextPageToken
  return makeGmailApiRequest(`/messages?${queryParams.toString()}&fields=messages(id,threadId),nextPageToken,resultSizeEstimate`);
}

/**
 * Get a specific email by ID
 * @param messageId The ID of the message to retrieve
 */
export async function getEmailById(messageId: string): Promise<any> {
  return makeGmailApiRequest(`/messages/${messageId}`);
}

/**
 * Update an email (e.g., mark as read, archive, etc.)
 * @param messageId The ID of the message to update
 * @param addLabelIds Array of label IDs to add
 * @param removeLabelIds Array of label IDs to remove
 */
export async function updateEmail(
  messageId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<any> {
  return makeGmailApiRequest(`/messages/${messageId}/modify`, 'POST', {
    addLabelIds,
    removeLabelIds,
  });
}

/**
 * Mark an email as read
 * @param messageId The ID of the message to mark as read
 */
export async function markAsRead(messageId: string): Promise<any> {
  return updateEmail(messageId, [], ['UNREAD']);
}

/**
 * Mark an email as unread
 * @param messageId The ID of the message to mark as unread
 */
export async function markAsUnread(messageId: string): Promise<any> {
  return updateEmail(messageId, ['UNREAD'], []);
}

/**
 * Archive an email (remove from inbox)
 * @param messageId The ID of the message to archive
 */
export async function archiveEmail(messageId: string): Promise<any> {
  return updateEmail(messageId, [], ['INBOX']);
}

/**
 * Delete an email (move to trash)
 * @param messageId The ID of the message to delete
 */
export async function deleteEmail(messageId: string): Promise<any> {
  try {
    return await makeGmailApiRequest(`/messages/${messageId}/trash`, 'POST');
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

/**
 * Permanently delete an email (skip trash)
 * @param messageId The ID of the message to permanently delete
 */
export async function permanentlyDeleteEmail(messageId: string): Promise<any> {
  try {
    return await makeGmailApiRequest(`/messages/${messageId}`, 'DELETE');
  } catch (error) {
    console.error('Error permanently deleting email:', error);
    throw error;
  }
}

/**
 * Add one or more labels to an email
 * @param messageId The ID of the message to label
 * @param labelIds Array of label IDs to add to the message
 */
export async function addLabels(messageId: string, labelIds: string[]): Promise<any> {
  return updateEmail(messageId, labelIds, []);
}

/**
 * Remove one or more labels from an email
 * @param messageId The ID of the message
 * @param labelIds Array of label IDs to remove from the message
 */
export async function removeLabels(messageId: string, labelIds: string[]): Promise<any> {
  return updateEmail(messageId, [], labelIds);
}

/**
 * Get all available labels in the user's Gmail account
 */
export async function getLabels(): Promise<any> {
  try {
    return await makeGmailApiRequest('/labels');
  } catch (error) {
    console.error('[gmailApi:Error] getLabels failed:', error);
    throw error;
  }
}

/**
 * Create a new label
 * @param name The name of the label to create
 */
export async function createLabel(name: string): Promise<any> {
  try {
    return await makeGmailApiRequest('/labels', 'POST', { name });
  } catch (error) {
    console.error('[gmailApi:Error] createLabel failed:', error);
    throw error;
  }
}

/**
 * Snooze an email by removing from inbox and adding a custom label
 * Note: This uses a custom implementation as Gmail API doesn't directly support snoozing
 * @param messageId The ID of the message to snooze
 * @param snoozeUntil Date to snooze the email until
 */
export async function snoozeEmail(messageId: string, snoozeUntil: Date): Promise<any> {
  try {
    // First, create or find the 'SNOOZED' label
    let snoozedLabelId: string;
    
    try {
      const labels = await getLabels();
      const snoozedLabel = labels.labels.find((label: any) => label.name === 'SNOOZED');
      
      if (snoozedLabel) {
        snoozedLabelId = snoozedLabel.id;
      } else {
        console.log('[gmailApi:Action] Creating SNOOZED label...');
        const newLabel = await createLabel('SNOOZED');
        snoozedLabelId = newLabel.id;
      }
    } catch (labelError) {
      console.error('[gmailApi:Error] Failed to get or create SNOOZED label:', labelError);
      throw new Error('Failed to manage SNOOZED label for snoozing.');
    }
    
    // Remove from inbox and add the SNOOZED label
    await updateEmail(messageId, [snoozedLabelId], ['INBOX']);
    
    // NOTE: Storing specific snooze *times* should be handled outside the core API service,
    // potentially in the hook using AsyncStorage.
    console.log(`[gmailApi:Action] Marked ${messageId} with SNOOZED label.`);

    // Return minimal confirmation or relevant info if needed by caller
    return { success: true, messageId }; 

  } catch (error) {
    console.error(`[gmailApi:Action:Error] Failed to snooze email ${messageId}:`, error);
    throw error;
  }
}

/**
 * Send an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body (plain text or HTML)
 * @param isHtml Whether the body content is HTML
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<any> {
  console.log(`[gmailApi:Action] Sending email to ${to}`);
  try {
    // Get sender dynamically if needed, or default to 'me'
    const sender = 'me'; // Simpler: assume 'me', can be enhanced if needed
    const rawMessage = [
      `From: ${sender}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      body,
    ].join('\r\n');

    const encodedMessage = encodeBase64Url(rawMessage);

    const response = await makeGmailApiRequest('/messages/send', 'POST', { raw: encodedMessage });
    console.log(`[gmailApi:Action] Email sent successfully to ${to}`);
    return response;
  } catch (error) {
    console.error(`[gmailApi:Action:Error] Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Helper to base64url encode a string
 */
function encodeBase64Url(str: string): string {
  let base64 = Buffer.from(str).toString('base64');
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return base64;
}

/**
 * Helper function to parse email data from Gmail API response
 * @param message The Gmail API message object
 */
export function parseEmailData(message: any): EmailData {
  const headers = message.payload.headers;
  
  const getHeader = (name: string): string => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };
  
  let body = '';
  
  // Extract body content recursively from parts
  const extractBody = (part: any) => {
    if (part.body && part.body.data) {
      // Decode base64url encoded data
      const decodedData = atob(
        part.body.data.replace(/-/g, '+').replace(/_/g, '/')
      );
      body += decodedData;
    }
    
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };
  
  if (message.payload) {
    if (message.payload.body && message.payload.body.data) {
      const decodedData = atob(
        message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')
      );
      body = decodedData;
    } else if (message.payload.parts) {
      message.payload.parts.forEach(extractBody);
    }
  }
  
  // Check if this email is unread
  const isUnread = message.labelIds?.includes('UNREAD') || false;
  
  return {
    id: message.id,
    threadId: message.threadId,
    snippet: message.snippet,
    subject: getHeader('subject'),
    from: getHeader('from'),
    to: getHeader('to'),
    date: new Date(getHeader('date')),
    body,
    isUnread
  };
}

/**
 * Revokes access to Gmail API
 */
export async function revokeGmailAccess(): Promise<void> {
  try {
    console.log('[gmailApi:Auth] Revoking Gmail access...');
    // Get the current access token to revoke it specifically
    const { accessToken } = await GoogleSignin.getTokens(); 
    if (accessToken) {
      await GoogleSignin.revokeAccess();
      console.log('[gmailApi:Auth] Google access revoked.');
    } else {
       console.warn('[gmailApi:Auth] No access token found to revoke.');
    }
    await GoogleSignin.signOut();
    console.log('[gmailApi:Auth] Google Sign-Out complete.');
  } catch (error) {
    console.error('[gmailApi:Auth:Error] Error revoking access or signing out:', error);
    // Decide if you need to throw or just log
  }
}

/**
 * Get an attachment from an email
 * @param messageId The ID of the message containing the attachment
 * @param attachmentId The ID of the attachment to retrieve
 * @returns The attachment data (base64) and MIME type
 */
export async function getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; mimeType: string }> {
  try {
    const response = await makeGmailApiRequest(`/messages/${messageId}/attachments/${attachmentId}`);
    
    if (!response || !response.data) {
      throw new Error('No attachment data received');
    }
    
    // Gmail API returns attachments in base64url format
    // Convert to regular base64 if needed
    const data = response.data.replace(/-/g, '+').replace(/_/g, '/');
    
    return { 
      data, 
      mimeType: response.mimeType || 'application/octet-stream' 
    };
  } catch (error) {
    console.error(`Error fetching attachment ${attachmentId} from message ${messageId}:`, error);
    throw error;
  }
} 