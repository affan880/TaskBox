/**
 * Utility functions for validation
 */

/**
 * Validate an email address
 * @param email Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

/**
 * Validate a URL
 * @param url URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a file type is an image
 * @param mimeType MIME type to check
 * @returns Whether the file is an image
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if a file type is a document (PDF, Office, etc.)
 * @param mimeType MIME type to check
 * @returns Whether the file is a document
 */
export function isDocumentType(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf',
  ];
  
  return documentTypes.includes(mimeType);
}

/**
 * Get appropriate file icon name based on MIME type
 * @param mimeType MIME type to check
 * @returns Icon name for the file type
 */
export function getFileIconByType(mimeType: string): string {
  if (isImageType(mimeType)) {
    return 'image';
  }
  
  if (mimeType === 'application/pdf') {
    return 'file-pdf-box';
  }
  
  if (mimeType.includes('word') || mimeType === 'application/msword') {
    return 'file-word';
  }
  
  if (mimeType.includes('excel') || mimeType === 'application/vnd.ms-excel') {
    return 'file-excel';
  }
  
  if (mimeType.includes('powerpoint') || mimeType === 'application/vnd.ms-powerpoint') {
    return 'file-powerpoint';
  }
  
  if (mimeType === 'text/plain') {
    return 'file-document-outline';
  }
  
  return 'file-outline';
} 