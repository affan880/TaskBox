import { useState, useCallback } from 'react';
import { EventSourcePolyfill } from 'react-native-sse';
import { showToast } from '@/components/ui/toast';

type EmailGenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

type EmailRevision = {
  content: string;
  timestamp: string;
  revisionNumber: number;
};

type EmailGenerationResponse = {
  status: EmailGenerationStatus;
  revision?: EmailRevision;
  error?: string;
};

export function useGenerateEmail() {
  const [status, setStatus] = useState<EmailGenerationStatus>('idle');
  const [revisions, setRevisions] = useState<EmailRevision[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = useCallback(async (prompt: string) => {
    try {
      setStatus('generating');
      setError(null);
      setRevisions([]);

      const eventSource = new EventSourcePolyfill('/api/generate-email-with-revisions', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      eventSource.onmessage = (event) => {
        try {
          const data: EmailGenerationResponse = JSON.parse(event.data);
          
          if (data.status === 'complete') {
            setStatus('complete');
            eventSource.close();
            showToast({
              message: 'Email generation complete',
              type: 'success',
            });
          } else if (data.revision) {
            setRevisions(prev => [...prev, data.revision!]);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
          setError('Failed to parse server response');
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setError('Connection error occurred');
        setStatus('error');
        eventSource.close();
        showToast({
          message: 'Failed to generate email',
          type: 'error',
        });
      };

      // Cleanup function
      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.error('Error setting up EventSource:', err);
      setError('Failed to start email generation');
      setStatus('error');
      showToast({
        message: 'Failed to start email generation',
        type: 'error',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setRevisions([]);
    setError(null);
  }, []);

  return {
    status,
    revisions,
    error,
    generateEmail,
    reset,
  };
} 