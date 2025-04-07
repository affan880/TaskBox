import { useState, useCallback } from 'react';
import * as emailApi from '../services/email-api';
import { useAuthStore } from '../store/auth-store';
import { formatEmailsResponse, formatEmailDetails } from '../utils/email-formatter';
import { EmailData } from '../types/email';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Keys for AsyncStorage
const SNOOZED_EMAILS_KEY = '@snoozed_emails';

type SnoozeData = {
  emailId: string;
  snoozeUntil: string;
};

export function useGmail() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Fetch emails with pagination
  const fetchEmails = useCallback(async (maxResults = 20, pageToken?: string) => {
    try {
      console.log('Starting fetchEmails in useGmail hook', { maxResults, pageToken });
      setIsLoading(true);
      setError(null);
      
      console.log('Calling emailApi.fetchEmails...');
      const response = await emailApi.fetchEmails(maxResults, pageToken);
      console.log('Email API response received', { 
        hasMessages: !!response.messages, 
        messageCount: response.messages?.length || 0,
        hasNextPageToken: !!response.nextPageToken
      });
      
      console.log('Formatting email response...');
      const formattedEmails = formatEmailsResponse(response);
      console.log(`Formatted ${formattedEmails.length} emails`);
      
      // If this is the first page, replace the emails
      if (!pageToken) {
        console.log('Setting emails (first page)');
        setEmails(formattedEmails);
      } else {
        console.log('Appending emails to existing list');
        setEmails(prev => [...prev, ...formattedEmails]);
      }
      
      setNextPageToken(response.nextPageToken || null);
      console.log('Email fetch completed successfully');
      return true;
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      console.error('Error details:', error.message);
      setError(error.message || 'Failed to load emails');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load more emails
  const loadMoreEmails = useCallback(async () => {
    if (isLoadingMore || !nextPageToken || isLoading) return false;
    
    try {
      setIsLoadingMore(true);
      
      const response = await emailApi.fetchEmails(20, nextPageToken);
      const formattedEmails = formatEmailsResponse(response);
      
      setEmails(prev => [...prev, ...formattedEmails]);
      setNextPageToken(response.nextPageToken || null);
      return true;
    } catch (error: any) {
      console.error('Error loading more emails:', error);
      // Don't set the error state here to avoid disrupting the UI
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, isLoadingMore, isLoading]);
  
  // Fetch email by ID
  const fetchEmailById = useCallback(async (emailId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await emailApi.getEmailDetails(emailId);
      const formattedEmail = formatEmailDetails(response);
      
      setCurrentEmail(formattedEmail);
      return formattedEmail;
    } catch (error: any) {
      console.error('Error fetching email details:', error);
      setError(error.message || 'Failed to load email details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Send email
  const sendEmail = useCallback(async (to: string, subject: string, body: string, draft = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await emailApi.sendEmail(to, subject, body);
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error);
      setError(error.message || 'Failed to send email');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Mark email as read
  const markAsRead = useCallback(async (emailId: string) => {
    try {
      await emailApi.markAsRead(emailId);
      
      // Update emails list
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId 
            ? { ...email, isUnread: false } 
            : email
        )
      );
      
      return true;
    } catch (error: any) {
      console.error('Error marking as read:', error);
      return false;
    }
  }, []);
  
  // Mark email as unread
  const markAsUnread = useCallback(async (emailId: string) => {
    try {
      await emailApi.markAsUnread(emailId);
      
      // Update emails list
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId 
            ? { ...email, isUnread: true } 
            : email
        )
      );
      
      return true;
    } catch (error: any) {
      console.error('Error marking as unread:', error);
      return false;
    }
  }, []);
  
  // Archive email
  const archiveEmail = useCallback(async (emailId: string) => {
    try {
      await emailApi.archiveEmail(emailId);
      
      // Remove email from list
      setEmails(prevEmails => 
        prevEmails.filter(email => email.id !== emailId)
      );
      
      return true;
    } catch (error: any) {
      console.error('Error archiving email:', error);
      return false;
    }
  }, []);
  
  // Delete email (move to trash)
  const deleteEmail = useCallback(async (emailId: string) => {
    try {
      await emailApi.deleteEmail(emailId);
      
      // Remove email from list
      setEmails(prevEmails => 
        prevEmails.filter(email => email.id !== emailId)
      );
      
      return true;
    } catch (error: any) {
      console.error('Error deleting email:', error);
      return false;
    }
  }, []);
  
  // Fetch labels
  const fetchLabels = useCallback(async () => {
    try {
      const response = await emailApi.getLabels();
      setLabels(response.labels || []);
      
      return response.labels;
    } catch (error: any) {
      console.error('Error fetching labels:', error);
      return [];
    }
  }, []);
  
  // Apply label to email
  const applyLabel = useCallback(async (emailId: string, labelId: string) => {
    try {
      await emailApi.applyLabel(emailId, labelId);
      return true;
    } catch (error: any) {
      console.error('Error applying label:', error);
      return false;
    }
  }, []);
  
  // Snooze email (custom implementation using labels and local storage)
  const snoozeEmail = useCallback(async (emailId: string, snoozeUntil: Date) => {
    try {
      // First archive the email
      await emailApi.archiveEmail(emailId);
      
      // Store snooze data in AsyncStorage
      const snoozeDataString = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      let snoozeData: SnoozeData[] = snoozeDataString 
        ? JSON.parse(snoozeDataString) 
        : [];
      
      // Add or update snooze information
      const existingIndex = snoozeData.findIndex(item => item.emailId === emailId);
      if (existingIndex >= 0) {
        snoozeData[existingIndex].snoozeUntil = snoozeUntil.toISOString();
      } else {
        snoozeData.push({
          emailId,
          snoozeUntil: snoozeUntil.toISOString()
        });
      }
      
      // Save updated snooze data
      await AsyncStorage.setItem(SNOOZED_EMAILS_KEY, JSON.stringify(snoozeData));
      
      // Remove from emails list
      setEmails(prevEmails => 
        prevEmails.filter(email => email.id !== emailId)
      );
      
      return true;
    } catch (error: any) {
      console.error('Error snoozing email:', error);
      return false;
    }
  }, []);
  
  // Check for emails that need to be unsnoozed
  const checkSnoozedEmails = useCallback(async () => {
    try {
      // Get snoozed emails data
      const snoozeDataString = await AsyncStorage.getItem(SNOOZED_EMAILS_KEY);
      if (!snoozeDataString) return;
      
      const snoozeData: SnoozeData[] = JSON.parse(snoozeDataString);
      const now = new Date();
      const emailsToUnsnooze: string[] = [];
      const updatedSnoozeData: SnoozeData[] = [];
      
      // Find emails that need to be unsnoozed
      snoozeData.forEach(item => {
        const snoozeUntil = new Date(item.snoozeUntil);
        if (snoozeUntil <= now) {
          emailsToUnsnooze.push(item.emailId);
        } else {
          updatedSnoozeData.push(item);
        }
      });
      
      // If there are emails to unsnooze
      if (emailsToUnsnooze.length > 0) {
        // Return each email to inbox
        for (const emailId of emailsToUnsnooze) {
          try {
            // Move back to inbox by applying INBOX label
            await emailApi.applyLabel(emailId, 'INBOX');
            console.log(`Unsnoozed email: ${emailId}`);
          } catch (error) {
            console.error(`Failed to unsnooze email ${emailId}:`, error);
          }
        }
        
        // Update storage with remaining snoozed emails
        await AsyncStorage.setItem(SNOOZED_EMAILS_KEY, JSON.stringify(updatedSnoozeData));
        
        // Refresh emails list to include unsnoozed emails
        fetchEmails();
      }
    } catch (error) {
      console.error('Error checking snoozed emails:', error);
    }
  }, [fetchEmails]);
  
  return {
    emails,
    currentEmail,
    isLoading,
    error,
    labels,
    nextPageToken,
    isLoadingMore,
    fetchEmails,
    loadMoreEmails,
    fetchEmailById,
    sendEmail,
    markAsRead,
    markAsUnread,
    archiveEmail,
    deleteEmail,
    fetchLabels,
    applyLabel,
    snoozeEmail,
    checkSnoozedEmails
  };
} 