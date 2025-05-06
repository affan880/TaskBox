import { useState, useCallback } from 'react';
import { BASE_URL } from '@/lib/env/api-config';
import { getAccessTokenForAPI } from '@/api/gmail-api';

export type SenderEmail = {
  subject: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  messageId: string;
  threadId: string;
};

export type Sender = {
  email: string;
  emailCount: number;
  lastEmailDate: string;
  emails: SenderEmail[];
};

export type SortBySenderResponse = {
  senders: Sender[];
  summary: {
    totalEmails: number;
    totalSenders: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
};

export function useSortBySender() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [summary, setSummary] = useState<SortBySenderResponse['summary'] | null>(null);

  const fetchSenders = useCallback(async (days: number = 7) => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessTokenForAPI();
      const res = await fetch(`${BASE_URL}/sort-by-sender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accessToken, days }),
      });
      if (!res.ok) throw new Error('Failed to fetch senders');
      const data: SortBySenderResponse = await res.json();
      setSenders(data.senders);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSenderEmails = useCallback(async (sender: string, days: number = 7) => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessTokenForAPI();
      const res = await fetch(`${BASE_URL}/sort-by-sender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accessToken, days, sender }),
      });
      if (!res.ok) throw new Error('Failed to fetch sender emails');
      const data: SortBySenderResponse = await res.json();
      setSenders(data.senders);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, senders, summary, fetchSenders, fetchSenderEmails };
} 