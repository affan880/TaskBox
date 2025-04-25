import { TaskData } from './task';

/**
 * Project data type representing a project containing multiple tasks
 */
export type ProjectData = {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  tasks: string[]; // Array of task IDs
  isCompleted: boolean;
  labelColor?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Project with full task data expanded (for UI purposes)
 */
export type ProjectWithTasks = Omit<ProjectData, 'tasks'> & {
  tasks: TaskData[];
};

/**
 * Project creation input type
 */
export type ProjectCreateInput = Omit<ProjectData, 'id' | 'tasks' | 'isCompleted' | 'createdAt' | 'updatedAt'>; 