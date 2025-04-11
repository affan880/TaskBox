import { 
  EmailData, 
  GmailApiEmailResponse, 
  GmailApiListResponse, 
  EmailHeader,
  EmailPart 
} from '../types/email';

/**
 * Formats the response from the Gmail API listing emails
 */
export function formatEmailsResponse(response: GmailApiListResponse): EmailData[] {
  console.log("Real Response:::::::::::::::::", response)
  if (!response.messages || !Array.isArray(response.messages)) {
    console.log('email-formatter: No messages in response or invalid format');
    return [];
  }
  
  return response.messages.map((message: any) => {
    // If this is just a message reference with id and threadId
    if (!message.payload) {
      console.log(`email-formatter: Message ${message.id} has no payload, using placeholder data`);
      return {
        id: message.id,
        threadId: message.threadId,
        from: 'Unknown Sender',
        to: 'Unknown Recipient',
        subject: 'Email Subject Unavailable',
        snippet: message.snippet || 'No preview available',
        date: new Date().toISOString(),
        isUnread: message.labelIds?.includes('UNREAD') || false,
        hasAttachments: false,
        labelIds: message.labelIds || [],
        internalDate: message.internalDate || String(Date.now())
      };
    }
    
    // If this is a full message with payload
    try {
      return formatEmailDetails(message);
    } catch (error) {
      console.error(`email-formatter: Error formatting message ${message.id}:`, error);
      
      // Extract as much information as possible from the partial message
      const headers = message.payload?.headers || [];
      const subject = findHeader(headers, 'Subject') || 'No Subject';
      const from = parseFromHeader(findHeader(headers, 'From') || 'Unknown Sender');
      const to = findHeader(headers, 'To') || 'Unknown Recipient';
      const date = findHeader(headers, 'Date') || new Date().toISOString();
      
      return {
        id: message.id,
        threadId: message.threadId || message.id,
        from,
        to,
        subject,
        snippet: message.snippet || 'No preview available',
        date: formatDate(date),
        isUnread: message.labelIds?.includes('UNREAD') || false,
        hasAttachments: false,
        labelIds: message.labelIds || [],
        internalDate: message.internalDate || String(Date.now())
      };
    }
  });
}

/**
 * Formats a single email's details from the Gmail API response
 */
export function formatEmailDetails(email: GmailApiEmailResponse): EmailData {
  // Extract headers
  const headers = email.payload.headers || [];
  const subject = findHeader(headers, 'Subject') || 'No Subject';
  const from = parseFromHeader(findHeader(headers, 'From') || '');
  const to = findHeader(headers, 'To') || '';
  const date = findHeader(headers, 'Date') || new Date().toISOString();
  
  // Extract body
  const body = extractBody(email.payload);
  
  // Check for attachments
  const hasAttachments = checkForAttachments(email.payload);
  
  return {
    id: email.id,
    threadId: email.threadId,
    from,
    to,
    subject,
    snippet: email.snippet || '',
    body,
    date: formatDate(date),
    isUnread: email.labelIds?.includes('UNREAD') || false,
    hasAttachments,
    labelIds: email.labelIds || [],
    internalDate: email.internalDate,
  };
}

/** * Find a specific header by name from the headers array
 */
function findHeader(headers: EmailHeader[], name: string): string | undefined {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value;
}

/**
 * Parse the From header to extract just the name or email
 */
function parseFromHeader(from: string): string {
  // Format: "Name <email@example.com>" or just "email@example.com"
  const match = from.match(/^"?([^"<]+)"?\s*(?:<([^>]+)>)?$/);
  if (match) {
    // If there's a name, use it; otherwise use the email
    return match[1].trim();
  }
  return from;
}

/**
 * Format the date string to a more readable format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    // Return ISO string for consistent formatting
    return date.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Extract the body content from the email payload
 */
function extractBody(payload: GmailApiEmailResponse['payload']): string {
  // If the payload is text directly
  if (payload.mimeType.includes('text/plain') && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  
  // If the payload is HTML directly
  if (payload.mimeType.includes('text/html') && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  
  // If it's multipart, we need to find the text or html part
  if (payload.mimeType.includes('multipart') && payload.parts && payload.parts.length > 0) {
    // First try to find HTML part
    const htmlPart = findPart(payload.parts, 'text/html');
    if (htmlPart && htmlPart.body?.data) {
      return decodeBase64(htmlPart.body.data);
    }
    
    // If no HTML, try to find plain text part
    const textPart = findPart(payload.parts, 'text/plain');
    if (textPart && textPart.body?.data) {
      return decodeBase64(textPart.body.data);
    }
  }
  
  // If we get here, we couldn't find any text content
  return '';
}

/**
 * Find a specific MIME type part from the parts array
 */
function findPart(parts: EmailPart[], mimeType: string): EmailPart | undefined {
  // Try to find a part with the exact MIME type
  let part = parts.find(p => p.mimeType === mimeType);
  
  // If not found, try to search recursively in nested parts
  if (!part) {
    for (const p of parts) {
      if (p.parts && p.parts.length > 0) {
        part = findPart(p.parts, mimeType);
        if (part) break;
      }
    }
  }
  
  return part;
}

/**
 * Check if the email has attachments
 */
function checkForAttachments(payload: GmailApiEmailResponse['payload']): boolean {
  // Check if current payload has an attachment
  if (payload.body?.attachmentId) {
    return true;
  }
  
  // Check nested parts recursively
  if (payload.parts && payload.parts.length > 0) {
    return payload.parts.some(part => {
      if (part.body?.attachmentId) {
        return true;
      }
      
      // Check nested parts if any
      if (part.parts && part.parts.length > 0) {
        return checkForAttachments({ ...payload, parts: part.parts });
      }
      
      return false;
    });
  }
  
  return false;
}

/**
 * Decode base64 string (Gmail API uses base64url encoding)
 */
function decodeBase64(data: string): string {
  try {
    // Replace URL-safe chars and add padding if needed
    const base64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '');
    
    // Decode the string
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    console.error('Error decoding base64:', e);
    return '';
  }
} 
