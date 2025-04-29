import { TaskData } from './task';

/**
 * Project data type representing a project containing multiple tasks
 */
export type Project = {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Project with full task data expanded (for UI purposes)
 */
export type ProjectWithTasks = Project & {
  tasks: TaskData[];
};

/**
 * Project creation input type
 */
export type ProjectCreateInput = {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}; 