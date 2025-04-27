
import { getAllSnoozedEmails, removeSnoozeData } from './snooze-storage';

export async function handleSnoozedEmails(gmail: any) {
  try {
    const snoozedEmails = await getAllSnoozedEmails();
    const now = new Date();

    for (const snoozeData of snoozedEmails) {
      const snoozeTime = new Date(snoozeData.snoozeTime);
      
      // Check if it's time to unsnooze
      if (snoozeTime <= now) {
        // Move emails back to inbox
        await Promise.all(
          snoozeData.emailIds.map((id) =>
            gmail.users.messages.modify({
              userId: 'me',
              id,
              requestBody: {
                addLabelIds: ['INBOX'],
                removeLabelIds: [snoozeData.labelId],
              },
            })
          )
        );

        // Remove snooze data from storage
        await removeSnoozeData(snoozeData.emailIds);
      }
    }
  } catch (error) {
    console.error('Error handling snoozed emails:', error);
  }
}

// Function to check snoozed emails periodically
export function startSnoozeHandler(gmail: any) {
  // Check every minute
  const interval = setInterval(() => {
    handleSnoozedEmails(gmail).catch(console.error);
  }, 60 * 1000);

  return () => clearInterval(interval);
} 