import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FIREBASE_WEB_CLIENT_ID, FIREBASE_IOS_CLIENT_ID } from '@env';

// Gmail API base URL
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error && errorJson.error.code === 401) {
        console.log('Auth error in Gmail API, getting fresh token');
        // Instead of using refreshAuthToken, try to get a fresh token directly
        try {
          // Configure GoogleSignin to ensure it's properly initialized
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          // Attempt to get fresh tokens
          await GoogleSignin.getTokens();
        } catch (refreshError) {
          console.error('Failed to get fresh token:', refreshError);
          throw new Error('Failed to refresh authentication token');
        }
      }
      throw new Error(errorJson.error?.message || 'Unknown API error');
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`API Error: ${errorText || response.statusText}`);
      }
      throw e;
    }
  }
  return response.json();
}

// Get the current auth token
async function getAuthToken(): Promise<string> {
  try {
    console.log('Getting auth token for API request');
    
    // Try to ensure GoogleSignin is properly configured before getting tokens
    try {
      // Import and ensure GoogleSignin configuration
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      
      console.log('Configuring GoogleSignin with appropriate scopes');
      GoogleSignin.configure({
        webClientId: FIREBASE_WEB_CLIENT_ID,
        iosClientId: FIREBASE_IOS_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'profile',
          'email',
          'openid'
        ],
        offlineAccess: true,
      });
      
      // Small delay to ensure configuration is applied
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Checking if user is signed in with Google');
      const isSignedIn = await (GoogleSignin as any).isSignedIn();
      console.log('User is signed in with Google:', isSignedIn);
      
      if (!isSignedIn) {
        console.log('User not signed in with Google, attempting to get current user info');
        try {
          const userInfo = await GoogleSignin.getCurrentUser();
          console.log('Current user info obtained:', userInfo ? 'yes' : 'no');
        } catch (userInfoError) {
          console.log('Could not get current user info:', userInfoError);
        }
      }
    } catch (configError) {
      console.log('Error during GoogleSignin configuration:', configError);
    }
    
    // Get fresh tokens directly from GoogleSignin
    try {
      console.log('Attempting to get tokens from GoogleSignin');
      const { accessToken } = await GoogleSignin.getTokens();
      
      if (!accessToken) {
        console.error('No access token available');
        throw new Error('No access token available');
      }
      
      console.log('Successfully retrieved access token');
      return accessToken;
    } catch (tokenError) {
      console.log('Error getting tokens:', tokenError);
      
      // Try silent sign-in as fallback
      try {
        console.log('Attempting silent sign-in as fallback');
        const userInfo = await GoogleSignin.signInSilently();
        console.log('Silent sign-in successful:', userInfo ? 'yes' : 'no');
        
        const { accessToken } = await GoogleSignin.getTokens();
        if (accessToken) {
          console.log('Successfully retrieved access token after silent sign-in');
          return accessToken;
        }
      } catch (silentSignInError) {
        console.log('Silent sign-in failed:', silentSignInError);
      }
      
      throw new Error('Not authenticated');
    }
  } catch (error) {
    console.error('Authentication error in getAuthToken:', error);
    throw new Error('Not authenticated');
  }
}

// Fetch emails with pagination
export async function fetchEmails(maxResults = 20, pageToken?: string): Promise<any> {
  try {
    console.log('email-api: Starting fetchEmails', { maxResults, pageToken });
    
    console.log('email-api: Getting auth token...');
    const accessToken = await getAuthToken();
    console.log('email-api: Auth token retrieved successfully');
    
    let url = `${GMAIL_API_BASE_URL}/messages?maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    
    console.log(`email-api: Making request to ${url.split('?')[0]}...`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`email-api: Received response with status ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('email-api: Error response', { status: response.status, body: errorText });
      throw new Error(`Gmail API error: ${response.status} - ${errorText || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('email-api: Response parsed successfully', { 
      hasMessages: !!data.messages, 
      messageCount: data.messages?.length || 0 
    });
    
    // If we have messages, fetch the full details for each message
    if (data.messages && data.messages.length > 0) {
      console.log('email-api: Fetching full message details for each email...');
      
      // Use Promise.all to fetch all email details in parallel
      const fullMessages = await Promise.all(
        data.messages.map(async (msg: { id: string }) => {
          try {
            const detailUrl = `${GMAIL_API_BASE_URL}/messages/${msg.id}`;
            const detailResponse = await fetch(detailUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!detailResponse.ok) {
              console.error(`email-api: Error fetching details for message ${msg.id}: ${detailResponse.status}`);
              // Return the message ID and threadID so we don't lose the reference
              return msg;
            }
            
            const detailData = await detailResponse.json();
            return detailData;
          } catch (error) {
            console.error(`email-api: Error fetching details for message ${msg.id}:`, error);
            // Return the message ID and threadID so we don't lose the reference
            return msg;
          }
        })
      );
      
      console.log(`email-api: Fetched full details for ${fullMessages.length} messages`);
      
      // Return the full messages data with the next page token
      return {
        messages: fullMessages,
        nextPageToken: data.nextPageToken,
        resultSizeEstimate: data.resultSizeEstimate
      };
    }
    
    return data;
  } catch (error) {
    console.error('email-api: Error fetching emails:', error);
    if (error instanceof Error) {
      console.error('email-api: Error details:', error.message);
    }
    throw error;
  }
}

// Get email details by ID
export async function getEmailDetails(emailId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching email details:', error);
    throw error;
  }
}

// Send an email
export async function sendEmail(to: string, subject: string, body: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    // Encode the email content according to RFC 2822
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ].join('\r\n');
    
    // Base64 encode the email content
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailContent)));
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64EncodedEmail,
      }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Archive an email
export async function archiveEmail(emailId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['INBOX'],
      }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
}

// Delete an email (move to trash)
export async function deleteEmail(emailId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}/trash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

// Apply label to an email
export async function applyLabel(emailId: string, labelId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addLabelIds: [labelId],
      }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error applying label:', error);
    throw error;
  }
}

// Get all available labels
export async function getLabels(): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/labels`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching labels:', error);
    throw error;
  }
}

// Mark email as read
export async function markAsRead(emailId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
}

// Mark email as unread
export async function markAsUnread(emailId: string): Promise<any> {
  try {
    const idToken = await getAuthToken();
    
    const response = await fetch(`${GMAIL_API_BASE_URL}/messages/${emailId}/modify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addLabelIds: ['UNREAD'],
      }),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error marking as unread:', error);
    throw error;
  }
} 