/**
 * Task data type representing a single task in the task list
 */
export type TaskData = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  status: TaskStatus;
  dueDate?: Date;
  priority: TaskPriority;
  tags?: string[];
  attachments: TaskAttachment[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  parentTaskId?: string; // for subtasks
  subtasks?: string[]; // array of subtask IDs
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  labels?: string[];
  dependencies?: string[]; // array of task IDs this task depends on
  progress?: number; // 0-100
  lastWorkedOn?: string;
  reminder?: string; // ISO date string
  customFields?: Record<string, any>;
};

/**
 * Task priority enum
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task status enum
 */
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

/**
 * Task recurring interval enum
 */
export type RecurringInterval = 'daily' | 'weekly' | 'monthly';

/**
 * Task attachment type
 */
export type TaskAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  downloadUrl?: string;
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