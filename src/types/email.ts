/**
 * Interface for email data
 */
export interface EmailData {
  /**
   * Unique identifier for the email
   */
  id: string;
  
  /**
   * ID of the conversation thread this email belongs to
   */
  threadId: string;
  
  /**
   * Email sender (name and email address)
   */
  from: string;
  
  /**
   * Email recipient(s)
   */
  to: string;
  
  /**
   * Email subject line
   */
  subject: string;
  
  /**
   * Brief preview/snippet of the email body
   */
  snippet: string;
  
  /**
   * Full HTML body content of the email (optional, typically only loaded when viewing an email)
   */
  body?: string;
  
  /**
   * ISO-formatted date string for when the email was sent/received
   */
  date: string;
  
  /**
   * Whether the email has been read by the user
   */
  isUnread: boolean;
  
  /**
   * Whether the email has file attachments
   */
  hasAttachments: boolean;
  
  /**
   * List of label IDs associated with this email
   */
  labelIds: string[];
}

/**
 * Email header type
 */
export type EmailHeader = {
  name: string;
  value: string;
};

/**
 * Email part type for multipart emails
 */
export type EmailPart = {
  mimeType: string;
  filename?: string;
  headers?: EmailHeader[];
  body?: {
    size: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: EmailPart[];
};

/**
 * Raw Gmail API response format
 */
export type GmailApiEmailResponse = {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    mimeType: string;
    filename?: string;
    headers: EmailHeader[];
    body: {
      size: number;
      data?: string;
      attachmentId?: string;
    };
    parts?: EmailPart[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
};

/**
 * Gmail API labels response
 */
export type GmailApiLabelsResponse = {
  labels: Array<{
    id: string;
    name: string;
    type: string;
    messageListVisibility: string;
    labelListVisibility: string;
  }>;
};

/**
 * Response format for listing emails
 */
export type GmailApiListResponse = {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string | null;
  resultSizeEstimate: number;
};

/**
 * Email snooze data
 */
export type SnoozeData = {
  emailId: string;
  snoozeUntil: string;
}; 