import { Attachment } from 'src/types/email';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Helper function to get access token for Gmail API
 * @returns Access token string or empty string if error
 */
export const getAccessToken = async (): Promise<string> => {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken || '';
  } catch (error) {
    console.error('Error getting access token:', error);
    return '';
  }
};

/**
 * Fetch full email details with complete payload from Gmail API
 * @param emailId The Gmail message ID
 * @returns Full message details with payload
 */
export const fetchFullEmailDetails = async (emailId: string): Promise<any> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`, 
      {
        headers: {  
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const fullMessageInfo = await response.json();
    console.log('Fetched full message structure with payload');
    return fullMessageInfo;
  } catch (error) {
    console.error('Error fetching full message details:', error);
    return null;
  }
};

/**
 * Extract attachments from Gmail message payload
 * @param payload The Gmail message payload object
 * @returns Array of Attachment objects
 */
export const extractAttachmentsFromPayload = (payload: any): Attachment[] => {
  const attachments: Attachment[] = [];
  
  // Function to recursively search for attachments in message parts
  const findAttachments = (part: any) => {
    // Check if this part is an attachment
    if (part.filename && part.filename.length > 0 && part.body && part.body.attachmentId) {
      // Calculate attachment size display
      const sizeInBytes = part.body.size || 0;
      let sizeDisplay = '0 B';
      
      if (sizeInBytes < 1024) {
        sizeDisplay = `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        sizeDisplay = `${(sizeInBytes / 1024).toFixed(1)} KB`;
      } else {
        sizeDisplay = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
      }
      
      // Extract file extension
      const filenameParts = part.filename.split('.');
      const fileExt = filenameParts.length > 1 ? filenameParts.pop().toLowerCase() : '';
      
      // Ensure attachmentId is a string
      const attachmentId = String(part.body.attachmentId);
      
      attachments.push({
        id: attachmentId,
        name: part.filename,
        type: fileExt,
        size: sizeInBytes,
        sizeDisplay,
        contentType: part.mimeType || 'application/octet-stream',
        attachmentId: attachmentId, // Real Gmail attachment ID
        data: '' // Will be populated when fetched
      });
    }
    
    // Recursively check child parts
    if (part.parts && part.parts.length > 0) {
      for (const childPart of part.parts) {
        findAttachments(childPart);
      }
    }
  };
  
  // Start searching from the top-level payload
  if (payload) {
    findAttachments(payload);
  }
  
  return attachments;
};

/**
 * Fetches the attachments for an email, including metadata and content
 * @param emailId The Gmail message ID
 * @param fetchAttachmentFn The function to fetch an individual attachment's data
 * @returns Full email details with attachment data
 */
export const fetchEmailAttachments = async  (
  emailId: string, 
  fetchAttachmentFn: (messageId: string, attachmentId: string, filename: string, type: string) => Promise<{ data: string; mimeType: string } | null>
): Promise<{ attachments: Attachment[], success: boolean }> => {
  try {
    // Fetch full message with all parts
    const fullMessageDetails = await fetchFullEmailDetails(emailId);
    console.log("Full Details#######", fullMessageDetails)
    
    if (!fullMessageDetails || !fullMessageDetails.payload) {
      console.log('Could not get full message details with payload');
      return { attachments: [], success: false };
    }
    
    // Extract attachment metadata from payload
    const extractedAttachments = extractAttachmentsFromPayload(fullMessageDetails.payload);
    console.log(`Found ${extractedAttachments.length} attachments`);
    
    if (extractedAttachments.length === 0) {
      return { attachments: [], success: false };
    }

    console.log("Here I'M###############",extractedAttachments)
    
    // Fetch the actual attachment data
    const attachmentsWithData = await Promise.all(
      extractedAttachments.map(async (attachment) => {
        if (attachment.attachmentId) {
          try {
            console.log(`Fetching attachment ${attachment.attachmentId}`);
            const attachmentId = String(attachment.attachmentId);
            const filename = String(attachment.name)
            const type = String(attachment.type)
            const attachmentData = await fetchAttachmentFn(emailId, attachmentId, filename, type);
             
            if (attachmentData) {
              return {
                ...attachment,
                data: attachmentData.data,
                contentType: attachmentData.mimeType || attachment.contentType
              };
            }
          } catch (error) {
            console.error(`Error fetching attachment data:`, error);
          }
        }
        return attachment;
      })
    );
    
    return { 
      attachments: attachmentsWithData, 
      success: true 
    };
  } catch (error) {
    console.error('Error processing attachments:', error);
    return { attachments: [], success: false };
  }
}; 