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

import axios from 'axios';
import { Email } from '../types/email';

// API base URL (replace with your actual API endpoint)
const BASE_URL = 'https://api.example.com';

// Base URL for Gmail API
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

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
  attachments: EmailAttachment[] = []
) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    console.log(`[gmailApi:Email] Sending email to: ${to}`);
    console.log(`[gmailApi:Email] Subject: ${subject}`);
    console.log(`[gmailApi:Email] With ${attachments.length} attachments`);

    const fromEmail = await getEmailAddress();
    
    // Creating the email content
    const messageParts = [];
    
    // Add email headers
    const headers = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
    ];
    
    // If we have attachments, create a multipart message
    const multipartBoundary = `------MultipartBoundary${Date.now().toString(16)}`;
    
    if (attachments.length > 0) {
      headers.push(`Content-Type: multipart/mixed; boundary="${multipartBoundary}"`);
      messageParts.push(headers.join('\r\n') + '\r\n\r\n');
      
      // Add the body part
      messageParts.push(
        `--${multipartBoundary}\r\n` +
        'Content-Type: text/plain; charset=UTF-8\r\n' +
        'Content-Transfer-Encoding: 7bit\r\n\r\n' +
        `${body}\r\n\r\n`
      );
      
      // Add each attachment
      for (const attachment of attachments) {
        try {
          console.log(`[gmailApi:Email] Processing attachment: ${attachment.name} (${attachment.type})`);
          
          // Normalize the URI path for file system operations
          const normalizedUri = normalizeFileUri(attachment.uri);
          console.log(`[gmailApi:Email] Normalized URI: ${normalizedUri}`);
          
          // Check if the file exists
          const fileExists = await RNBlobUtil.fs.exists(normalizedUri);
          console.log(`[gmailApi:Email] File exists check: ${fileExists ? 'YES' : 'NO'}`);
          
          if (!fileExists) {
            console.error(`[gmailApi:Email:Error] File does not exist: ${normalizedUri}`);
            throw new Error(`Attachment file not found: ${attachment.name}`);
          }
          
          try {
            // Get file stats for logging
            const stat = await RNBlobUtil.fs.stat(normalizedUri);
            console.log(`[gmailApi:Email] File stats: size=${stat.size}, lastModified=${stat.lastModified}`);
          } catch (statsError) {
            console.warn(`[gmailApi:Email] Could not get file stats: ${statsError}`);
          }
          
          console.log(`[gmailApi:Email] Reading file content...`);
          
          // Read the file content with error handling
          let fileContent;
          try {
            fileContent = await RNBlobUtil.fs.readFile(normalizedUri, 'base64');
          } catch (readError) {
            console.error(`[gmailApi:Email:Error] Failed to read attachment file:`, readError);
            throw new Error(`Failed to read attachment file: ${attachment.name}`);
          }
          
          if (!fileContent || fileContent.length === 0) {
            console.error(`[gmailApi:Email:Error] Empty file content for: ${attachment.name}`);
            throw new Error(`Empty attachment file: ${attachment.name}`);
          }
          
          console.log(`[gmailApi:Email] File read successfully, size: ${fileContent.length} bytes`);
          
          // Per Gmail API documentation, we need to ensure proper MIME type and encoding
          const contentType = attachment.type || 'application/octet-stream';
          
          // Add attachment part with proper Content-Disposition and Content-Transfer-Encoding
          messageParts.push(
            `--${multipartBoundary}\r\n` +
            `Content-Type: ${contentType}; name="${attachment.name}"\r\n` +
            'Content-Transfer-Encoding: base64\r\n' +
            `Content-Disposition: attachment; filename="${attachment.name}"\r\n\r\n` +
            `${chunkString(fileContent, 76).join('\r\n')}\r\n\r\n`
          );
          
          console.log(`[gmailApi:Email] Attachment part added successfully for: ${attachment.name}`);
        } catch (attachmentError) {
          console.error(`[gmailApi:Email:Error] Error processing attachment ${attachment.name}:`, attachmentError);
          // Continue with other attachments instead of failing the whole email
        }
      }
      
      // Close the multipart message with proper boundary termination
      messageParts.push(`--${multipartBoundary}--`);
    } else {
      // Simple email without attachments
      headers.push('Content-Type: text/plain; charset=UTF-8');
      messageParts.push(headers.join('\r\n') + '\r\n\r\n' + body);
    }
    
    // Join all parts to create the raw message
    const rawMessage = messageParts.join('');
    
    // URL-safe base64 encode the message
    console.log(`[gmailApi:Email] Encoding email message...`);
    const encodedMessage = encodeBase64UrlForRN(rawMessage);
    console.log(`[gmailApi:Email] Email encoded, sending to Gmail API...`);
    
    // Using the appropriate Gmail API endpoint for sending messages
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          raw: encodedMessage 
        }),
      }
    );
    
    // Check for response issues
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gmailApi:Email:Error] Gmail API error response:', errorText);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }
    
    console.log(`[gmailApi:Email] Email sent successfully!`);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('[gmailApi:Email:Error] Error sending email:', error);
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
  // Standard base64 encoding
  let encoded = btoa(input);
  
  // Make URL safe
  encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  return encoded;
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
    const response = await axios.get(`${BASE_URL}/emails`);
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