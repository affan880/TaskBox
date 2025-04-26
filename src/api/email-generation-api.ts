import axios from 'axios';
import { EMAIL_GENERATION_API } from '@/lib/config';

export type EmailTone = 'professional' | 'casual' | 'friendly';

export type GenerateEmailRequest = {
  subject?: string;
  body?: string;
  recipientEmail?: string;
  tone: EmailTone;
};

export type GenerateEmailResponse = {
  subject: string;
  body: string;
};

// Create an axios instance with custom config
const api = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

export async function generateEmail(params: GenerateEmailRequest): Promise<GenerateEmailResponse> {
  try {
    console.log('[EmailGeneration] Generating email with params:', params);
    
    // Add validation for required fields
    if (!params.subject && !params.body) {
      throw new Error('Either subject or body is required');
    }

    const response = await api.post(EMAIL_GENERATION_API.GENERATE, params);
    
    // Validate response data
    if (!response.data || (!response.data.subject && !response.data.body)) {
      throw new Error('Invalid response from server');
    }

    console.log('[EmailGeneration] Generated email response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[EmailGeneration] Error generating email:', error);
    
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your internet connection.');
      }
    }
    
    // Generic error
    throw new Error(error instanceof Error ? error.message : 'Failed to generate email');
  }
} 