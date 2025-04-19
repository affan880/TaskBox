import { useState } from 'react';
import { showToast } from '@/components/ui/toast';
import { useEmailStore } from '../../email/store/email-store';
import { useTaskStore } from '../../../store/task-store';

type TaskData = {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  labels: string[];
};

export function useCreateTask() {
  const [isLoading, setIsLoading] = useState(false);
  const { selectedEmails } = useEmailStore();
  const { createTask } = useTaskStore();

  const handleCreateTask = async () => {
    if (!selectedEmails.length) {
      showToast({
        message: 'Please select an email first',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      const email = selectedEmails[0]; // For now, we'll create a task from the first selected email

      // Extract relevant information from the email
      const taskData: TaskData = {
        title: email.subject,
        description: `From: ${email.from}\n\n${email.snippet}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        priority: 'medium',
        status: 'todo',
        labels: ['email'],
      };

      await createTask(taskData);
      showToast({
        message: 'Task created successfully',
        type: 'success'
      });
    } catch (error) {
      showToast({
        message: 'Failed to create task',
        type: 'error'
      });
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCreateTask,
    isLoading,
  };
} 