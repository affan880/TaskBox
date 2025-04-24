import { getAccessToken } from '@/lib/utils/email-attachments';
import { BASE_URL } from '@/lib/env/api-config';
import type { EmailData } from 'src/types/email';

// Debug flag - only log in development mode
const DEBUG = __DEV__ && false; // Set to true for verbose debugging

// Only log the BASE_URL once at module load time
if (DEBUG) console.log('📍 Email Analysis API - BASE_URL:', BASE_URL);

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
 * Analyzes emails using the backend API
 * @param count Optional number of emails to analyze
 * @param days Optional number of days to analyze
 * @param category Optional category to focus on
 * @returns The analysis results from the API
 */
export async function analyzeEmails(count?: number, days?: number, category?: string): Promise<EmailAnalysisResponse> {
  if (DEBUG) console.log('📍 API Call - Using BASE_URL:', BASE_URL);
  try {
    // Get the access token
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    // Prepare the request body
    const requestBody: { accessToken: string; days?: number; count?: number; category?: string } = {
      accessToken,
    };
    
    // Add optional parameters if provided
    if (days !== undefined) {
      requestBody.days = days;
    }
    
    if (count !== undefined) {
      requestBody.count = count;
    }
    
    if (category && category !== 'All') {
      requestBody.category = category;
    }
    
    if (DEBUG) {
      console.log('Analyzing emails with parameters:', JSON.stringify(requestBody, (key, value) => 
        key === 'accessToken' ? '[REDACTED]' : value
      ));
      
      // Log the full URL we're calling (without access token)
      const fullApiUrl = `${BASE_URL}/api/analyze-emails`;
      console.log('📍 Calling API at:', fullApiUrl);
    }
    
    // Make the POST request to the analysis endpoint
    const response = await fetch(`${BASE_URL}/api/analyze-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Email analysis API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    if (DEBUG) console.log('Email analysis response:', responseData);
    
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
      throw new Error(`Email summary API error (${response.status}): ${errorText}`);
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
      throw new Error(`Email intent detection API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Email intent detection response:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error detecting email intent:', error);
    throw error;
  }
} 