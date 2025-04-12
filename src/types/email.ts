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

  /**
   * Internal date of the email
   */
  internalDate: string;

  /**
   * List of email attachments
   */
  attachments: Attachment[];

  /**
   * Whether the email is important
   */
  isImportant?: boolean;

  /**
   * Whether the email is starred
   */
  isStarred?: boolean;
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

// Define the basic structure of an email based on previous usage
export type ExtendedEmailData = {
  id: string;
  from: string;
  to?: string; // Optional
  cc?: string; // Optional
  subject: string;
  body?: string; // Optional (might be HTML or plain text)
  date: string; // ISO 8601 date string typically
  hasAttachments?: boolean;
  isImportant?: boolean;
  isStarred?: boolean;
  attachments?: Attachment[]; // Use the Attachment type below
  // Add any other relevant fields like snippet, threadId, etc.
};

// Define the Attachment type used across components
export type Attachment = {
  id: string; // This is the API's attachmentId (body.attachmentId)
  filename: string;
  mimeType: string;
  size: number; 
};

// Define the EmailLabel type
export type EmailLabel =
  | 'important'
  | 'inbox'
  | 'sent'
  | 'draft'
  | 'starred'
  | 'spam'
  | 'trash'
  | 'snoozed'
  | 'forum'
  | 'updates'
  | 'promotions'
  | 'social'
  | string; // Allow for custom labels as strings

// TODO: Define a stricter type for the GMAIL_COLORS theme object if needed elsewhere
export type GmailTheme = {
    primary: string;
    primaryDark: string;
    secondary: string;
    surface: string;
    background: string;
    backgroundSecondary: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    chip: {
      background: string;
      text: string;
    };
    label: {
      inbox: string;
      important: string;
      flagged: string;
      draft: string;
    };
    attachment: {
      background: string;
      icon: string;
    };
}; 