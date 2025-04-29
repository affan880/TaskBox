/**
 * Task data type representing a single task in the task list
 */
export type TaskData = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  priority: TaskPriority;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Task priority enum
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task attachment type
 */
export type TaskAttachment = {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  createdAt: string;
  downloadUrl?: string;
  isUploading?: boolean;
};

/**
 * Task list type
 */
export type TaskList = {
  id: string;
  name: string;
  tasks: TaskData[];
  color: string;
  icon?: string;
};

/**
 * Task filter options
 */
export type TaskFilter = {
  showCompleted: boolean;
  priority?: TaskPriority;
  searchQuery?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}; 