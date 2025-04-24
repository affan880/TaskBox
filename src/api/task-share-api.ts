import axios from 'axios';
import { BASE_URL } from '@/lib/env/api-config';
import { TaskData } from '@/types/task';

interface ShareTaskProps {
  task: TaskData;
  emails: string[];
  message?: string;
}

/**
 * Shares a task via email with one or more recipients
 */
export async function shareTaskViaEmail({ task, emails, message }: ShareTaskProps): Promise<{ success: boolean }> {
  try {
    const response = await axios.post(`${BASE_URL}/tasks/share`, {
      taskId: task.id,
      recipientEmails: emails,
      message: message || '',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sharing task:', error);
    throw error;
  }
} 