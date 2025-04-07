/**
 * Email data type representing a single email in the inbox
 */
export type EmailData = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  isUnread: boolean;
  hasAttachments: boolean;
  labelIds: string[];
  internalDate?: string;
};

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
  nextPageToken?: string;
  resultSizeEstimate: number;
};

/**
 * Email snooze data
 */
export type SnoozeData = {
  emailId: string;
  snoozeUntil: string;
}; 