import { useState, useCallback } from 'react';
import * as GmailAPI from '../utils/gmail-api';
import { EmailData } from '../utils/gmail-api';

export function useGmail() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch emails from the user's inbox
   */
  const fetchEmails = useCallback(async (maxResults = 10, labelIds = ['INBOX']) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await GmailAPI.getEmails(maxResults, labelIds);
      
      // Parse the email data
      const parsedEmails = response.map((email: any) => 
        GmailAPI.parseEmailData(email)
      );
      
      setEmails(parsedEmails);
      
      return parsedEmails;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emails';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a specific email by ID
   */
  const fetchEmailById = useCallback(async (messageId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await GmailAPI.getEmailById(messageId);
      const parsedEmail = GmailAPI.parseEmailData(response);
      
      setCurrentEmail(parsedEmail);
      return parsedEmail;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send an email
   */
  const sendEmail = useCallback(async (to: string, subject: string, body: string, isHtml = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await GmailAPI.sendEmail(to, subject, body, isHtml);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Mark an email as read
   */
  const markAsRead = useCallback(async (messageId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await GmailAPI.markAsRead(messageId);
      
      // Update local state if this email is in our list
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === messageId 
            ? { ...email, isUnread: false } 
            : email
        )
      );
      
      if (currentEmail?.id === messageId) {
        setCurrentEmail(prev => prev ? { ...prev, isUnread: false } : null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark email as read';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentEmail]);

  /**
   * Mark an email as unread
   */
  const markAsUnread = useCallback(async (messageId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await GmailAPI.markAsUnread(messageId);
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === messageId 
            ? { ...email, isUnread: true } 
            : email
        )
      );
      
      if (currentEmail?.id === messageId) {
        setCurrentEmail(prev => prev ? { ...prev, isUnread: true } : null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark email as unread';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentEmail]);

  /**
   * Archive an email
   */
  const archiveEmail = useCallback(async (messageId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await GmailAPI.archiveEmail(messageId);
      
      // Remove from local state
      setEmails(prevEmails => 
        prevEmails.filter(email => email.id !== messageId)
      );
      
      if (currentEmail?.id === messageId) {
        setCurrentEmail(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive email';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentEmail]);

  return {
    emails,
    currentEmail,
    isLoading,
    error,
    fetchEmails,
    fetchEmailById,
    sendEmail,
    markAsRead,
    markAsUnread,
    archiveEmail,
  };
} 