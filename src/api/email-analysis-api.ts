import { getAccessToken } from '@/lib/utils/email-attachments';
import { BASE_URL, isFeatureEnabled } from '@/lib/env/api-config';
import { storageConfig } from '@/lib/storage';
import EventSourcePolyfill from 'react-native-sse';

// Debug flag - only log in development mode
const DEBUG = __DEV__ && false; // Set to true for verbose debugging

// Always log the BASE_URL for debugging production issues
console.log('📍 Email Analysis API - BASE_URL:', BASE_URL);
console.log('📍 Email Analysis API - Environment:', __DEV__ ? 'Development' : 'Production');

/**
 * API response type for the email analysis endpoint
 */
export type EmailAnalysisResponse = {
  message: string;
  categorizedEmails: Record<string, any[]>;
}

/**
 * API response type for the email summary endpoint
 */
export type EmailSummaryResponse = {
  summary: string;
  html?: string;
}

/**
 * API response type for the intent detection endpoint
 */
export type EmailIntentResponse = {
  message: string;
  intent: string;
  suggestedAction?: {
    type: string;
    dueDate: string | null;
    text: string;
  };
}

/**
 * API response type for the email generation endpoint
 */
export type EmailGenerationResponse = {
  subject?: string;
  body?: string;
  html?: string;
}

export type EmailGenerationRequest = {
  subject?: string;
  body?: string;
  recipientEmail?: string;
  tone?: string;
  prompt?: string; // For chat-based enhancements
}

type EmailAnalysisRequest = {
  count: number;
  days: number;
  categories: string[];
};

/**
 * Analyzes emails using the backend API
 * @param count Optional number of emails to analyze
 * @param days Optional number of days to analyze
 * @param category Optional category to focus on
 * @param categories Optional array of all available categories
 * @returns The analysis results from the API
 */
export async function analyzeEmails(
  count?: number,
  days?: number,
  category?: string,
  categories?: string[]
): Promise<EmailAnalysisResponse> {
  // Check if feature is enabled
  if (!isFeatureEnabled('EMAIL_ANALYSIS')) {
    throw new Error('Email analysis is not available in this environment. This feature requires a backend server with AI capabilities.');
  }

  const STORAGE_KEY = 'email_categories';
  const storedCategories = await storageConfig.getItem(STORAGE_KEY);
  console.log('storedCategories', storedCategories);

  if (DEBUG) console.log('📍 API Call - Using BASE_URL:', BASE_URL);
  try {
    if (!storedCategories || storedCategories.length === 0) {
      throw new Error('No categories provided for email analysis');
    }

    // Filter out 'All' category and normalize the rest
    const filteredCategories = (storedCategories as string[])
      .filter((cat: string) => cat.toLowerCase() !== 'all')
      .map((category: string) => category.toLowerCase())
      .filter((category: string, index: number, self: string[]) => self.indexOf(category) === index); // Remove duplicates

    if (filteredCategories.length === 0) {
      throw new Error('No valid categories provided for email analysis');
    }

    const requestBody: EmailAnalysisRequest = {
      count: count || 40,
      days: days || 7,
      categories: filteredCategories
    };

    // Get the access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    if (DEBUG) {
      console.log('Analyzing emails with parameters:', JSON.stringify(requestBody, (key, value) => 
        key === 'accessToken' ? '[REDACTED]' : value
      ));
      
      // Log the full URL we're calling (without access token)
      const fullApiUrl = `${BASE_URL}/api/analyze-emails`;
      console.log('📍 Calling API at:', fullApiUrl);
    }

    // Log the request body before making the API call
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    
    // Make the POST request to the analysis endpoint
    const response = await fetch(`${BASE_URL}/api/analyze-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestBody,
        accessToken,
      }),
    });
    
    console.log('📍 API Response Status:', response.status);
    console.log('📍 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📍 API Error Response:', errorText);
      console.error('📍 Request URL:', `${BASE_URL}/api/analyze-emails`);
      console.error('📍 Request Body:', JSON.stringify(requestBody, null, 2));
      
      // Try to parse the error response for more specific error handling
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If parsing fails, use the raw text
      }
      
      // Check for specific error types
      if (errorData?.details?.includes('Invalid Credentials') || errorData?.googleApiError?.error?.code === 401) {
        throw new Error('Gmail access token is invalid or expired. Please sign out and sign in again to refresh your authentication.');
      } else if (errorData?.details?.includes('payment method')) {
        throw new Error('AI service is temporarily unavailable due to billing issues. Please try again later or contact support.');
      } else if (errorData?.details?.includes('Cohere')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('Email analysis service is not available. The backend server does not have this endpoint implemented.');
      } else if (response.status >= 500) {
        throw new Error('Email analysis service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Email analysis API error (${response.status}): ${errorData?.error || errorText}`);
      }
    }
    
    const responseData = await response.json();
    if (DEBUG) console.log('Email analysis response:', responseData);
    
    console.log('🔍 Response_______________/analyze-emails:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error analyzing emails:', error);
    throw error;
  }
} 

/**
 * Summarizes a single email using the backend API
 * @param emailBody The body content of the email to summarize
 * @returns The summary results from the API
 */
export async function summarizeEmailContent(emailBody: string): Promise<EmailSummaryResponse> {
  // Check if feature is enabled
  if (!isFeatureEnabled('EMAIL_SUMMARIZATION')) {
    throw new Error('Email summarization is not available in this environment. This feature requires a backend server with AI capabilities.');
  }

  if (DEBUG) console.log('📍 API Call - Summarizing email content');
  try {
    // Make the POST request to the summary endpoint
    const response = await fetch(`${BASE_URL}/api/summarize-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailBody,
      }),
    });
    console.log('🔍 Response_______________:', BASE_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      
      // Try to parse the error response for more specific error handling
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If parsing fails, use the raw text
      }
      
      // Check for specific error types
      if (errorData?.details?.includes('payment method')) {
        throw new Error('AI service is temporarily unavailable due to billing issues. Please try again later or contact support.');
      } else if (errorData?.details?.includes('Cohere')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('Email summarization service is not available. The backend server does not have this endpoint implemented.');
      } else if (response.status >= 500) {
        throw new Error('Email summarization service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Email summary API error (${response.status}): ${errorData?.error || errorText}`);
      }
    }
    
    const responseData = await response.json();
    if (DEBUG) console.log('Email summary response:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error summarizing email:', error);
    throw error;
  }
}

/**
 * Detects intent for a single email using the backend API
 * @param messageId The ID of the email to analyze
 * @returns The intent detection results from the API
 */
export async function detectEmailIntent(messageId: string): Promise<EmailIntentResponse> {
  // Check if feature is enabled
  if (!isFeatureEnabled('INTENT_DETECTION')) {
    throw new Error('Email intent detection is not available in this environment. This feature requires a backend server with AI capabilities.');
  }

  console.log('📍 API Call - Detecting email intent for messageId:', messageId);
  try {
    // Get the access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    console.log('🔍 Access token_______________:', accessToken);
    
    // Log critical debug information
    console.log('🔍 Current BASE_URL in email-analysis-api:', BASE_URL);
    const fullApiUrl = `${BASE_URL}/api/detect-intent`;
    console.log('🔍 Full API URL being called:', fullApiUrl);
    
    // Make the POST request to the intent detection endpoint
    const response = await fetch(`${BASE_URL}/api/detect-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        messageId,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      
      // Try to parse the error response for more specific error handling
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If parsing fails, use the raw text
      }
      
      // Check for specific error types
      if (errorData?.details?.includes('Invalid Credentials') || errorData?.error?.includes('Invalid Credentials')) {
        throw new Error('Gmail access token is invalid or expired. Please sign out and sign in again to refresh your authentication.');
      } else if (errorData?.details?.includes('payment method')) {
        throw new Error('AI service is temporarily unavailable due to billing issues. Please try again later or contact support.');
      } else if (errorData?.details?.includes('Cohere')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('Email intent detection service is not available. The backend server does not have this endpoint implemented.');
      } else if (response.status >= 500) {
        throw new Error('Email intent detection service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Email intent detection API error (${response.status}): ${errorData?.error || errorText}`);
      }
    }
    
    const responseData = await response.json();
    console.log('Email intent detection response:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error detecting email intent:', error);
    throw error;
  }
}

/**
 * Generates email content using the backend API
 * @param params The parameters for email generation
 * @returns The generated email content from the API
 */
export async function generateEmailContent(params: EmailGenerationRequest): Promise<EmailGenerationResponse> {
  // Check if feature is enabled
  if (!isFeatureEnabled('EMAIL_GENERATION')) {
    throw new Error('Email generation is not available in this environment. This feature requires a backend server with AI capabilities.');
  }

  if (DEBUG) console.log('📍 API Call - Generating email content with params:', params);
  try {
    // Get the access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Make the POST request to the generation endpoint
    const response = await fetch(`${BASE_URL}/api/generate-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        accessToken,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      
      // Try to parse the error response for more specific error handling
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // If parsing fails, use the raw text
      }
      
      // Check for specific error types
      if (errorData?.details?.includes('payment method')) {
        throw new Error('AI service is temporarily unavailable due to billing issues. Please try again later or contact support.');
      } else if (errorData?.details?.includes('Cohere')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 404) {
        throw new Error('Email generation service is not available. The backend server does not have this endpoint implemented.');
      } else if (response.status >= 500) {
        throw new Error('Email generation service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Email generation API error (${response.status}): ${errorData?.error || errorText}`);
      }
    }
    
    const responseData = await response.json();
    if (DEBUG) console.log('Email generation response:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
} 

// --- Streaming Email Generation with Revisions (SSE) ---

export type EmailRevisionRequest = {
  message: string;
  context?: string;
};

export type EmailRevisionChunk = {
  content: string;
  timestamp: string;
  revisionNumber: number;
};

export async function streamGenerateEmailWithRevisionsSSE(
  request: EmailRevisionRequest,
  onChunk: (chunk: EmailRevisionChunk) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<() => void> {
  try {
    const eventSource = new EventSourcePolyfill(
      `${BASE_URL}/analyze-emails`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          prompt: request.message,
          context: request.context,
          tone: 'professional',
          isRevision: false,
          previousEmailsLength: 0
        }),
      }
    ) as EventSourcePolyfill & {
      onmessage: (event: MessageEvent) => void;
      onerror: (event: Event) => void;
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (err) {
          console.error('Invalid JSON in SSE message:', event.data);
          onError(new Error('Invalid server response format'));
          eventSource.close();
          return;
        }
        
        if (data.status === 'complete') {
          eventSource.close();
          onComplete();
        } else if (data.revision) {
          onChunk(data.revision);
        } else if (data.error) {
          onError(new Error(data.error));
          eventSource.close();
        }
      } catch (err) {
        console.error('Error processing SSE message:', err);
        onError(new Error('Failed to process server response'));
        eventSource.close();
      }
    };

    eventSource.onerror = (err: Event) => {
      console.error('EventSource error:', err);
      onError(new Error('Connection error occurred'));
      eventSource.close();
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  } catch (err) {
    console.error('Error setting up EventSource:', err);
    onError(new Error('Failed to start email generation'));
    throw err;
  }
}

export async function generateEmailWithRevisions(
  request: EmailRevisionRequest
): Promise<{ response: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/generate-email-with-revisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.message,
        context: request.context,
        tone: 'professional',
        isRevision: false,
        previousEmailsLength: 0
      }),
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(responseData?.message || `Failed to generate email: ${response.status}`);
    }

    return { response: responseData.response };
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
} 