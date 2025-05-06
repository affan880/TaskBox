import { useState, useCallback } from 'react';
import { BASE_URL } from '@/lib/env/api-config';
import { getAccessTokenForAPI } from '@/api/gmail-api';
import { 
  analyzeEmails, 
  detectEmailIntent, 
  generateEmailContent,
  EmailGenerationRequest,
  EmailAnalysisResponse,
  EmailIntentResponse,
  EmailGenerationResponse
} from '@/api/email-analysis-api';

export type ChatMessage = {
  type: 'user' | 'assistant';
  message: string;
  isLoading?: boolean;
  isError?: boolean;
  metadata?: {
    taskDetails?: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    };
    emailAnalysis?: EmailAnalysisResponse;
    emailIntent?: EmailIntentResponse;
    generatedEmail?: EmailGenerationResponse;
  };
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = message.trim();

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      { type: 'user', message: userMessage }
    ]);

    try {
      // Get access token for API calls
      const accessToken = await getAccessTokenForAPI();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Make the chat API request
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: userMessage,
          context: messages.map(msg => msg.message).join('\n')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      console.log('data', data);
      // Handle different intents
      let metadata = {};
      
      switch (data.intent) {
        case 'analyze_emails':
          const analysis = await analyzeEmails(40, 7, undefined, ['INBOX', 'UNREAD']);
          metadata = { emailAnalysis: analysis };
          break;

        case 'detect_intent':
          if (data.messageId) {
            const intent = await detectEmailIntent(data.messageId);
            metadata = { emailIntent: intent };
          }
          break;

        case 'generate_email':
          const emailRequest: EmailGenerationRequest = {
            subject: data.subject,
            body: data.body,
            recipientEmail: data.recipientEmail,
            tone: data.tone
          };
          const generatedEmail = await generateEmailContent(emailRequest);
          metadata = { generatedEmail };
          break;

        case 'create_task':
          metadata = { taskDetails: data.metadata?.taskDetails };
          break;
      }

      // Add assistant response to chat
      setMessages(prev => [
        ...prev,
        { 
          type: 'assistant', 
          message: data.response,
          metadata
        }
      ]);

      return { intent: data.intent, metadata };

    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages(prev => [
        ...prev,
        { 
          type: 'assistant', 
          message: 'Sorry, I encountered an error. Please try again.',
          isError: true 
        }
      ]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
} 