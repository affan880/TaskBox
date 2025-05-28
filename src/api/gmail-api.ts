import { GoogleSignin } from '@react-native-google-signin/google-signin';
import RNBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

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

// Define email attachment type
export type EmailAttachment = {
  name: string;
  type: string;
  uri: string;
  size?: number;
};

import { BASE_URL } from '@/lib/env/api-config';

import axios from 'axios';
import { Email } from '../types/email';

// Base URL for Gmail API
console.log('📍 Gmail API - BASE_URL:', BASE_URL);
const GMAIL_API_BASE_URL = `${BASE_URL}/api/gmail`;

// --- Token Caching and Refresh Synchronization ---
let tokenRetrievalPromise: Promise<string> | null = null;
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;
// Default token expiry time (55 minutes in ms - Google tokens typically last 60 minutes)
const TOKEN_EXPIRY_MS = 55 * 60 * 1000;

/**
 * Helper function to get a fresh access token, ensuring only one retrieval/refresh happens at a time.
 * INTERNAL USE ONLY - external code should use getAccessTokenForAPI()
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  const currentTime = Date.now();
  if (cachedToken && tokenExpiryTime > currentTime) {
    // console.log('[gmailApi:Auth] Using cached token');
    return cachedToken;
  }

  // If a retrieval/refresh is already in progress, wait for it
  if (tokenRetrievalPromise) {
    console.log('[gmailApi:Auth] Token retrieval/refresh in progress, waiting...');
    try {
      const token = await tokenRetrievalPromise;
      return token;
    } catch (waitError) {
      console.error('[gmailApi:Auth] Waiting for token retrieval/refresh failed:', waitError);
      // Rethrow so the caller knows the token fetch failed
      throw new Error('Failed to get access token while waiting for ongoing retrieval.'); 
    }
  }

  // --- Critical Section: Start Token Retrieval/Refresh ---
  console.log('[gmailApi:Auth] Token expired or not found. Initiating token retrieval/refresh...');
  tokenRetrievalPromise = (async (): Promise<string> => {
    try {
      // Attempt to get tokens silently first
      let tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        // Set token and expiry
        cachedToken = tokens.accessToken;
        tokenExpiryTime = currentTime + TOKEN_EXPIRY_MS;
        console.log('[gmailApi:Auth] Token cached, valid for 55 minutes');
        return cachedToken;
      }
      // If silent fails, initiate sign-in/refresh
      console.log('[gmailApi:Auth] Silent token retrieval failed or token missing, attempting sign-in/refresh...');
      await GoogleSignin.signInSilently(); // Or potentially signIn() if needed
      tokens = await GoogleSignin.getTokens();
      if (!tokens.accessToken) {
        throw new Error('Token refresh failed to produce an access token.');
      }
      
      // Set token and expiry
      cachedToken = tokens.accessToken;
      tokenExpiryTime = currentTime + TOKEN_EXPIRY_MS;
      console.log('[gmailApi:Auth] Token refresh successful. Valid for 55 minutes');
      return cachedToken;
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
    }
  })();

  return tokenRetrievalPromise;
  // --- End Critical Section ---
}

/**
 * Public function for external modules to get an access token.
 * Uses the same caching mechanism as internal functions.
 * @returns The access token string, or empty string on error
 */
export async function getAccessTokenForAPI(): Promise<string> {
  try {
    return await getAccessToken();
  } catch (error) {
    console.error('[gmailApi:Auth:Error] Error getting access token for external API:', error);
    return '';
  }
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
    // Get a valid token (either cached or fresh)
    const accessToken = await getAccessToken();
    
    // Make the API request with the token
    const response = await fetch(`${GMAIL_API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // console.log('response#################', response);
    // Handle token expiration or authorization errors
    if (response.status === 401) {
      // Token expired during use, invalidate cache
      cachedToken = null;
      tokenExpiryTime = 0;
      console.log('[gmailApi:Auth] Token expired during request, will refresh on next attempt');
      
      // Retry the request once with a fresh token
      const newToken = await getAccessToken();
      const retryResponse = await fetch(`${GMAIL_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`Gmail API error after token refresh (${retryResponse.status}): ${errorText}`);
      }
      
      return retryResponse.json();
    }
    
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
 * Get multiple emails in a single batch request (much more efficient)
 * @param messageIds Array of message IDs to retrieve
 * @returns Array of email data objects
 */
export async function getEmailsByIds(messageIds: string[]): Promise<EmailData[]> {
  try {
    console.log(`[gmailApi:Batch] Fetching ${messageIds.length} emails in batch`);
    
    // If there's only one message ID, just use the standard request
    if (messageIds.length === 1) {
      const message = await getEmailById(messageIds[0]);
      return [parseEmailData(message)];
    }
    
    // Get token for the batch request
    const accessToken = await getAccessToken();
    
    // Use the new batch endpoint implemented on our backend
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: messageIds }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    
    // The batch endpoint returns already parsed messages
    if (responseData.messages && Array.isArray(responseData.messages)) {
      return responseData.messages;
    }
    
    throw new Error('Invalid response format from batch endpoint');
  } catch (error) {
    console.error('[gmailApi:Error] Batch email fetch failed:', error);
    
    // Fallback to chunked requests if batch endpoint fails
    console.log('[gmailApi:Batch] Falling back to individual requests in chunks');
    
    // Process in chunks of 5 to avoid rate limits
    const chunkSize = 5;
    const emailsData: EmailData[] = [];
    
    for (let i = 0; i < messageIds.length; i += chunkSize) {
      const chunk = messageIds.slice(i, i + chunkSize);
      console.log(`[gmailApi:Batch] Processing chunk ${i/chunkSize + 1} of ${Math.ceil(messageIds.length/chunkSize)}`);
      
      const chunkResults = await Promise.all(
        chunk.map(async (id) => {
          try {
            const message = await getEmailById(id);
            return parseEmailData(message);
          } catch (err) {
            console.error(`[gmailApi:Error] Failed to fetch email ${id}:`, err);
            return null;
          }
        })
      );
      
      // Add non-null results to the emails array
      emailsData.push(...chunkResults.filter((email): email is EmailData => email !== null));
      
      // Add a small delay between chunks to avoid rate limits
      if (i + chunkSize < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return emailsData;
  }
}

/**
 * Search for messages matching a query.
 * @param query The search query string (Gmail search syntax)
 * @param maxResults Maximum number of messages to return
 * @param pageToken Optional page token for pagination
 */
export async function searchMessages(
  query: string,
  maxResults: number = 50, // Default to 50 for search
  pageToken?: string,
): Promise<any> { // Consider defining a specific type like ListMessagesResponse
  const queryParams = new URLSearchParams({
    q: query,
    maxResults: maxResults.toString(),
    fields: 'messages(id,threadId),nextPageToken,resultSizeEstimate', // Match listMessages fields
  });
  if (pageToken) {
    queryParams.append('pageToken', pageToken);
  }

  console.log(`[gmailApi:Search] Searching messages with query: "${query}"`);
  return makeGmailApiRequest(`/messages?${queryParams.toString()}`);
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
 * Normalizes a file URI to ensure it's correctly formatted for React Native Blob Util
 */
function normalizeFileUri(uri: string): string {
  // On iOS, convert file URLs to paths for RNBlobUtil
  if (Platform.OS === 'ios' && uri.startsWith('file://')) {
    return decodeURIComponent(uri).replace('file://', '');
  }
  return uri;
}

/**
 * Send email with Gmail API
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments: EmailAttachment[] = [],
  cc?: string,
  bcc?: string,
  originalHtml?: string
) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    if (!to || typeof to !== 'string' || to.trim() === '') {
      console.error('[gmailApi:Email:Validation] "To" field is invalid:', to);
      throw new Error('Invalid "To" field: Recipient address is required.');
    }

    console.log(`[gmailApi:Email] Preparing to send email to: ${to.trim()}`);
    if (cc && cc.trim()) console.log(`[gmailApi:Email] CC: ${cc.trim()}`);
    if (bcc && bcc.trim()) console.log(`[gmailApi:Email] BCC: ${bcc.trim()}`);
    console.log(`[gmailApi:Email] Subject: ${subject}`);
    console.log(`[gmailApi:Email] Attachments count: ${attachments.length}`);

    const fromEmail = await getEmailAddress();
    
    const headers = [
      `From: ${fromEmail}`,
      `To: ${to.trim()}`,
    ];

    // Add CC and BCC headers if present and valid
    if (cc && cc.trim()) {
      headers.push(`Cc: ${cc.trim()}`);
    }
    if (bcc && bcc.trim()) {
      headers.push(`Bcc: ${bcc.trim()}`);
    }

    headers.push(`Subject: ${subject}`);
    headers.push('MIME-Version: 1.0');

    let emailBodyContent = '';
    const messageBodyParts = [];

    if (attachments.length > 0) {
      const multipartBoundary = `----MultipartBoundary_${Date.now().toString(16)}`;
      headers.push(`Content-Type: multipart/mixed; boundary="${multipartBoundary}"`);

      messageBodyParts.push(
        `--${multipartBoundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        originalHtml || body,
        ''
      );
      
      for (const attachment of attachments) {
        const fileData = await RNBlobUtil.fs.readFile(attachment.uri, 'base64');
        messageBodyParts.push(
          `--${multipartBoundary}`,
          `Content-Type: ${attachment.type}; name="${attachment.name}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${attachment.name}"`,
          '',
          fileData,
          ''
        );
      }
      messageBodyParts.push(`--${multipartBoundary}--`);
      emailBodyContent = messageBodyParts.join('\r\n');
    } else {
      headers.push('Content-Type: text/html; charset=UTF-8');
      emailBodyContent = originalHtml || body;
    }
    
    const rawMessage = headers.join('\r\n') + '\r\n\r\n' + emailBodyContent;
    
    console.log('[gmailApi:Email] Raw message constructed (first 300 chars):', rawMessage.substring(0,300));
    const encodedMessage = encodeBase64UrlForRN(rawMessage);
    
    console.log(`[gmailApi:Email] Sending encoded message to Gmail API...`);
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gmailApi:Email:Error] Gmail API error response text:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          throw new Error(`Gmail API Error: ${errorJson.error.message} (Status: ${response.status})`);
        }
      } catch (parseError) {
        console.warn('[gmailApi:Email:Error] Could not parse API error response as JSON:', parseError);
      }
      throw new Error(`Failed to send email via API: ${response.status} ${response.statusText}`);
    }
    
    console.log(`[gmailApi:Email] Email sent successfully!`);
    return await response.json();
  } catch (error) {
    console.error('[gmailApi:Email:Error] Error in sendEmail function execution:', error);
    throw error;
  }
}

// Helper function to chunk a string into specified length parts
function chunkString(str: string, length: number): string[] {
  const chunks = [];
  for (let i = 0, charsLength = str.length; i < charsLength; i += length) {
    chunks.push(str.substring(i, i + length));
  }
  return chunks;
}

/**
 * URL-safe base64 encode a string for React Native (no Buffer dependency)
 */
function encodeBase64UrlForRN(input: string): string {
  // Convert string to UTF-8 bytes
  const utf8Bytes = [];
  for (let i = 0; i < input.length; i++) {
    let charCode = input.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      // Surrogate pair
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }

  // Convert bytes to base64
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let i = 0;
  while (i < utf8Bytes.length) {
    const chunk = (utf8Bytes[i] << 16) | (utf8Bytes[i + 1] << 8) | utf8Bytes[i + 2];
    base64 += base64Chars[(chunk >> 18) & 63];
    base64 += base64Chars[(chunk >> 12) & 63];
    base64 += base64Chars[(chunk >> 6) & 63];
    base64 += base64Chars[chunk & 63];
    i += 3;
  }

  // Handle padding
  if (utf8Bytes.length % 3 === 1) {
    base64 = base64.slice(0, -2);
  } else if (utf8Bytes.length % 3 === 2) {
    base64 = base64.slice(0, -1);
  }

  // Make URL safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
export async function getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; size: number } | null> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${messageId}/attachments/${attachmentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gmail API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return {
      data: data.data,
      size: data.size,
    };
  } catch (error) {
    console.error(`[gmailApi] Error fetching attachment ${attachmentId} for message ${messageId}:`, error);
    return null;
  }
}

export async function fetchEmails(): Promise<Email[]> {
  try {
    console.log('📍 Fetching emails from:', `${BASE_URL}/api/emails`);
    const response = await axios.get(`${BASE_URL}/api/emails`);
    return response.data;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

/**
 * Get the user's email address from Google Sign-in
 */
async function getEmailAddress(): Promise<string> {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo?.user?.email || 'me';
  } catch (error) {
    console.error('Error getting email address:', error);
    return 'me'; // Fallback to 'me' which is accepted by Gmail API
  }
}

// --- Email cache to avoid duplicate fetches ---
let emailCache: Record<string, EmailData> = {};

/**
 * Clear the email cache
 */
export function clearEmailCache(): void {
  emailCache = {};
  console.log('[gmailApi:Cache] Email cache cleared');
}

/**
 * Get an email from the cache or fetch it if not found
 * @param messageId The message ID to retrieve
 * @returns The email data
 */
export async function getCachedEmailById(messageId: string): Promise<EmailData> {
  // Return from cache if available
  if (emailCache[messageId]) {
    console.log(`[gmailApi:Cache] Cache hit for email ${messageId}`);
    return emailCache[messageId];
  }
  
  // Fetch and cache if not found
  try {
    console.log(`[gmailApi:Cache] Cache miss for email ${messageId}, fetching`);
    const message = await getEmailById(messageId);
    const emailData = parseEmailData(message);
    emailCache[messageId] = emailData;
    return emailData;
  } catch (error) {
    console.error(`[gmailApi:Cache:Error] Failed to fetch email ${messageId}:`, error);
    throw error;
  }
}

/**
 * Fetch a list of emails with content in a single batch
 * This is much more efficient than making multiple API calls
 * @param maxResults Maximum number of messages to return
 * @param pageToken Token for the next page of results
 * @param labelIds Array of label IDs to filter by (e.g., 'INBOX', 'UNREAD')
 */
export async function listEmailsWithContent(
  maxResults: number = 20, 
  pageToken?: string, 
  labelIds: string[] = ['INBOX']
): Promise<{emails: EmailData[], nextPageToken?: string}> {
  try {
    // First, get the list of message IDs
    const messagesList = await listMessages(maxResults, pageToken, labelIds);
    
    // If there are no messages, return an empty array
    if (!messagesList.messages || messagesList.messages.length === 0) {
      return { emails: [] };
    }
    
    // Extract message IDs
    const messageIds = messagesList.messages.map((msg: any) => msg.id);
    
    // Check which IDs are already in cache
    const cachedIds = new Set(Object.keys(emailCache));
    const uncachedIds = messageIds.filter((id: string) => !cachedIds.has(id));
    
    // Prepare result array keeping the original order
    const emails: EmailData[] = [];
    
    // If we have uncached IDs, fetch them in batch
    if (uncachedIds.length > 0) {
      console.log(`[gmailApi:Listing] Fetching ${uncachedIds.length} uncached emails via batch`);
      
      const batchedEmails = await getEmailsByIds(uncachedIds);
      
      // Store all fetched emails in cache
      batchedEmails.forEach(email => {
        emailCache[email.id] = email;
      });
    }
    
    // Construct result array from cache maintaining original order
    messageIds.forEach((id: string) => {
      if (emailCache[id]) {
        emails.push(emailCache[id]);
      }
    });
    
    return { 
      emails, 
      nextPageToken: messagesList.nextPageToken 
    };
  } catch (error) {
    console.error('[gmailApi:Error] Failed to list emails with content:', error);
    throw error;
  }
}

/**
 * Reply to an email
 * @param messageId The ID of the message to reply to
 * @param body The reply message body
 * @param attachments Optional attachments to include
 */
export async function replyToEmail(
  messageId: string,
  body: string,
  attachments: EmailAttachment[] = []
): Promise<any> {
  try {
    // Get the original message to get the thread ID and subject
    const originalMessage = await getEmailById(messageId);
    if (!originalMessage) {
      throw new Error('Original message not found');
    }

    // Get the original sender's email
    const fromHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'from'
    );
    const to = fromHeader ? fromHeader.value : '';

    // Get the original subject and add "Re:" if not already present
    const subjectHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'subject'
    );
    let subject = subjectHeader ? subjectHeader.value : 'No Subject';
    if (!subject.toLowerCase().startsWith('re:')) {
      subject = `Re: ${subject}`;
    }

    // Format the body as HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${body}
      </div>
    `;

    // Send the reply
    return await sendEmail(to, subject, htmlBody, attachments);
  } catch (error) {
    console.error('[gmailApi:Error] Failed to reply to email:', error);
    throw error;
  }
}

/**
 * Reply to all recipients of an email
 * @param messageId The ID of the message to reply to
 * @param body The reply message body
 * @param attachments Optional attachments to include
 */
export async function replyAllToEmail(
  messageId: string,
  body: string,
  attachments: EmailAttachment[] = []
): Promise<any> {
  try {
    // Get the original message to get the thread ID and subject
    const originalMessage = await getEmailById(messageId);
    if (!originalMessage) {
      throw new Error('Original message not found');
    }

    // Get all recipients (To, Cc, Bcc)
    const toHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'to'
    );
    const ccHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'cc'
    );
    const fromHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'from'
    );

    // Combine all recipients
    const recipients = [
      toHeader?.value,
      ccHeader?.value,
      fromHeader?.value
    ].filter(Boolean).join(', ');

    // Get the original subject and add "Re:" if not already present
    const subjectHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'subject'
    );
    let subject = subjectHeader ? subjectHeader.value : 'No Subject';
    if (!subject.toLowerCase().startsWith('re:')) {
      subject = `Re: ${subject}`;
    }

    // Format the body as HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${body}
      </div>
    `;

    // Send the reply to all
    return await sendEmail(recipients, subject, htmlBody, attachments);
  } catch (error) {
    console.error('[gmailApi:Error] Failed to reply all to email:', error);
    throw error;
  }
}

/**
 * Forward an email
 * @param messageId The ID of the message to forward
 * @param to The recipient's email address
 * @param body Optional additional message body
 * @param attachments Optional attachments to include
 */
export async function forwardEmail(
  messageId: string,
  to: string,
  body: string = '',
  attachments: EmailAttachment[] = []
): Promise<any> {
  try {
    // Get the original message
    const originalMessage = await getEmailById(messageId);
    if (!originalMessage) {
      throw new Error('Original message not found');
    }

    // Get the original subject and add "Fwd:" if not already present
    const subjectHeader = originalMessage.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'subject'
    );
    let subject = subjectHeader ? subjectHeader.value : 'No Subject';
    if (!subject.toLowerCase().startsWith('fwd:')) {
      subject = `Fwd: ${subject}`;
    }

    // Get the original message body
    const originalBody = parseEmailData(originalMessage).body;

    // Format the forward message with proper HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${body}
        <div style="margin-top: 20px; padding: 15px; border-left: 3px solid #ccc; color: #666;">
          <div style="margin-bottom: 10px; font-weight: bold;">---------- Forwarded message ---------</div>
          ${originalBody}
        </div>
      </div>
    `;

    // Send the forwarded email
    return await sendEmail(to, subject, htmlBody, attachments);
  } catch (error) {
    console.error('[gmailApi:Error] Failed to forward email:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data
 * @returns Object containing deletion status and counts
 * @throws Error if deletion fails
 */
export async function deleteAccount(): Promise<{
  message: string;
  deletedData: {
    user: boolean;
    tasks: number;
  };
}> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    console.log('[gmailApi:Account] Initiating account deletion...');
    
    // Delete the account first
    const response = await fetch(`${BASE_URL}/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete account';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Handle specific error cases
      switch (response.status) {
        case 400:
          throw new Error('User ID is required');
        case 401:
          throw new Error('Authentication failed');
        case 404:
          throw new Error('User not found');
        default:
          throw new Error(errorMessage);
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.warn('[gmailApi:Account] Failed to parse response as JSON, using default success message');
      data = {
        message: 'Account successfully deleted',
        deletedData: {
          user: true,
          tasks: 0
        }
      };
    }

    // After successful deletion, revoke Gmail access
    await revokeGmailAccess();
    console.log('[gmailApi:Account] Gmail access revoked');

    console.log('[gmailApi:Account] Account deletion successful');
    return data;
  } catch (error: any) {
    console.error('[gmailApi:Account:Error] Account deletion failed:', error);
    throw error;
  }
}