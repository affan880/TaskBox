import { useState, useCallback } from 'react';
import { EmailData, Attachment } from '../../../types/email';
import { useEmailActions } from './use-email-actions';
import { fetchEmailAttachments } from '../../../utils/email-attachments';

// Type for emails with attachments
export type EmailWithAttachments = EmailData & {
  attachments: Attachment[];
};

/**
 * Hook for managing email attachments
 */
export function useEmailAttachments() {
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  
  // Get the fetchAttachment function from useEmailActions
  const { fetchAttachment } = useEmailActions();

  /**
   * Loads an email with its attachments
   * @param emailId The email ID
   * @param emailDetails The basic email details
   * @returns The email with attachments data
   */
  const loadEmailWithAttachments = useCallback(async (
    emailId: string,
    emailDetails: EmailData
  ): Promise<EmailWithAttachments | EmailData> => {
    // Reset state
    setIsLoadingAttachments(true);
    setAttachmentError(null);
    
    try {
      // Only proceed if the email has attachments
      if (!emailDetails.hasAttachments) {
        return emailDetails;
      }

      console.log('Loading email attachments:', emailId);
      
      // Fetch attachments using the utility function
      const { attachments, success } = await fetchEmailAttachments(emailId, fetchAttachment);
      
      if (success && attachments.length > 0) {
        // Create the email with attachments
        const emailWithAttachments: EmailWithAttachments = {
          ...emailDetails,
          attachments
        };
        
        console.log(`Successfully loaded ${attachments.length} attachments`);
        return emailWithAttachments;
      }
      
      // If we couldn't fetch attachments, return the original email details
      return emailDetails;
    } catch (error) {
      console.error('Error loading email attachments:', error);
      setAttachmentError('Failed to load attachments');
      return emailDetails;
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [fetchAttachment]);

  return {
    loadEmailWithAttachments,
    isLoadingAttachments,
    attachmentError
  };
} 