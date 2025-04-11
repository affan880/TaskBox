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

/**
 * Helper function to get a fresh access token
 */
async function getAccessToken(): Promise<string> {
  try {
    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) {
      throw new Error('No access token available');
    }
    return accessToken;
  } catch (error) {
    console.log('Error getting access token:', error);
    throw error;
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
    console.error(`Error in Gmail API request to ${endpoint}:`, error);
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
 * Get a list of emails from the user's inbox - SIMPLIFIED: Now just gets message list.
 * The hook (`useGmail`) will be responsible for fetching full details.
 * @param maxResults Maximum number of emails to return
 * @param labelIds Array of label IDs to filter by (e.g., 'INBOX', 'UNREAD')
 */
export async function getEmails(maxResults: number = 10, labelIds: string[] = ['INBOX']): Promise<any> {
  const queryParams = new URLSearchParams({
    maxResults: maxResults.toString(),
    labelIds: labelIds.join(','),
  }).toString();
  
  const response = await makeGmailApiRequest(`/messages?${queryParams}`);
  console.log('Gmail API response:', response);
  
  // If we just have message IDs, fetch the full content for each message
  if (response.messages && response.messages.length > 0) {
    const fullMessages = await Promise.all(
      response.messages.map((msg: { id: string }) => 
        makeGmailApiRequest(`/messages/${msg.id}`)
      )
    );
    return fullMessages;
  }
  
  return response;
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
    console.log('Error getting labels:', error);
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
    console.error('Error creating label:', error);
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
        // Create the label if it doesn't exist
        const newLabel = await createLabel('SNOOZED');
        snoozedLabelId = newLabel.id;
      }
    } catch (error) {
      console.error('Error finding/creating SNOOZED label:', error);
      throw new Error('Failed to find or create SNOOZED label');
    }
    
    // Store the snooze time in localStorage or a similar persistence mechanism
    // This is a simplified implementation - in a real app, you might use a server
    // to track snooze times or implement a background process to "unsnooze" emails
    try {
      const snoozeData = {
        messageId,
        snoozeUntil: snoozeUntil.toISOString(),
      };
      
      // Store the snooze data
      const existingData = localStorage.getItem('snoozedEmails');
      const snoozedEmails = existingData ? JSON.parse(existingData) : [];
      snoozedEmails.push(snoozeData);
      localStorage.setItem('snoozedEmails', JSON.stringify(snoozedEmails));
    } catch (error) {
      console.error('Error storing snooze data:', error);
      // Continue even if local storage fails
    }
    
    // Remove from inbox and add the SNOOZED label
    return updateEmail(messageId, [snoozedLabelId], ['INBOX']);
  } catch (error) {
    console.error('Error snoozing email:', error);
    throw error;
  }
}

/**
 * Send an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param body Email body (can be plain text or HTML)
 * @param isHtml Whether the body is HTML
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = false
): Promise<any> {
  try {
    // Construct email content following RFC 2822
    const contentType = isHtml ? 'text/html' : 'text/plain';
    const email = [
      `From: ${await getSenderEmail()}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}; charset=utf-8`,
      '',
      body
    ].join('\r\n');

    // Use base64 encoding (React Native compatible version)
    const encodedEmail = encodeBase64Url(email);
    
    console.log('Sending email to:', to);
    
    const response = await makeGmailApiRequest('/messages/send', 'POST', {
      raw: encodedEmail
    });
    
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Encodes a string to base64url format (safe for URLs)
 * React Native compatible version
 */
function encodeBase64Url(str: string): string {
  // First encode as regular base64
  let base64 = btoa(unescape(encodeURIComponent(str)));
  
  // Then convert to base64url by replacing chars that are different
  return base64
    .replace(/\+/g, '-')  // Convert '+' to '-'
    .replace(/\//g, '_')  // Convert '/' to '_'
    .replace(/=+$/, '');  // Remove trailing '='
}

/**
 * Get the current user's email address
 */
async function getSenderEmail(): Promise<string> {
  try {
    // Get user profile information
    const response = await makeGmailApiRequest('/profile');
    return response.emailAddress || '';
  } catch (error) {
    console.log('Error getting sender email:', error);
    return '';
  }
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
    // Check if user is signed in first
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) {
        console.log('User is not signed in, skipping Gmail access revocation');
        return;
      }
      
      const tokens = await GoogleSignin.getTokens();
      if (tokens && tokens.accessToken) {
        // Revoke the access token
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to revoke access');
        }
      }
    } catch (error) {
      console.log('Error getting tokens for revocation, continuing with sign out:', error);
      // We don't throw here to allow the sign out process to continue
    }
  } catch (error) {
    console.error('Error revoking Gmail access:', error);
    // Don't throw so sign out can continue
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