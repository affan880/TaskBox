import { useState } from 'react';
import { useGmail } from '../../../hooks/use-gmail';
import type { EmailData } from '../../../types/email';

export function useEmailActions() {
  const gmail = useGmail();
  const [isLoading, setIsLoading] = useState(false);

  const archiveEmail = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmail.archiveEmail(emailId);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmail = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmail.deleteEmail(emailId);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsUnread = async (emailId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await gmail.markAsUnread(emailId);
    } finally {
      setIsLoading(false);
    }
  };

  const applyLabel = async (emailId: string, labelId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement label application once the API is available
      console.warn('Label application not implemented yet');
    } finally {
      setIsLoading(false);
    }
  };

  const snoozeEmail = async (emailId: string, snoozeUntil: Date): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement email snoozing once the API is available
      console.warn('Email snoozing not implemented yet');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (
    to: string,
    subject: string,
    body: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await gmail.sendEmail(to, subject, body);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = async (): Promise<EmailData[]> => {
    setIsLoading(true);
    try {
      await gmail.fetchEmails();
      return gmail.emails;
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailDetails = async (emailId: string): Promise<EmailData | null> => {
    setIsLoading(true);
    try {
      return await gmail.fetchEmailById(emailId);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    archiveEmail,
    deleteEmail,
    markAsUnread,
    applyLabel,
    snoozeEmail,
    sendEmail,
    loadEmails,
    getEmailDetails,
  };
} 