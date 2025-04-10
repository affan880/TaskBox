// Find the loadEmails function to check the page token implementation

// Example implementation if needed:
// export const loadEmails = async (page: number, pageSize: number) => {
//   console.log(`Loading emails for page ${page}, pageSize ${pageSize}`);
//   try {
//     // Make API call ensuring we pass pageToken properly
//     const result = await gmailApi.fetchEmails(pageSize);
//     // Log any token received
//     console.log(`API response token: ${gmailApi.nextPageToken}`);
//     return result;
//   } catch (error) {
//     console.error('Error loading emails:', error);
//     return [];
//   }
// }; 