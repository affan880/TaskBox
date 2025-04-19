/**
 * API module for task-related operations
 */
import { getItem, setItem } from '../lib/storage/storage';
import { TaskData } from '../types/task';

const TASKS_STORAGE_KEY = 'tasks';

/**
 * Load tasks from storage
 * @returns Promise resolving to task data
 */
export async function loadTasks(): Promise<TaskData[]> {
  try {
    const tasks = await getItem<TaskData[]>(TASKS_STORAGE_KEY, []);
    return tasks || [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
}

/**
 * Save tasks to storage
 * @param tasks Tasks to save
 * @returns Promise resolving once tasks are saved
 */
export async function saveTasks(tasks: TaskData[]): Promise<void> {
  try {
    await setItem(TASKS_STORAGE_KEY, tasks);
  } catch (error) {
    console.error('Failed to save tasks:', error);
    throw error;
  }
}

/**
 * Create a new task
 * @param taskData Task data without ID and timestamps
 * @param existingTasks Current task list
 * @returns New task with ID and timestamps
 */
export function createTask(
  taskData: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>,
  existingTasks: TaskData[]
): TaskData {
  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const newTask: TaskData = {
    id,
    title: taskData.title,
    description: taskData.description,
    isCompleted: taskData.isCompleted ?? false,
    dueDate: taskData.dueDate,
    priority: taskData.priority || 'medium',
    tags: taskData.tags || [],
    attachments: taskData.attachments || [],
    createdAt: now,
    updatedAt: now,
  };
  
  return newTask;
}

/**
 * Update an existing task
 * @param tasks Current task list
 * @param taskId ID of task to update
 * @param updates Updates to apply to the task
 * @returns Updated task list
 */
export function updateTask(
  tasks: TaskData[],
  taskId: string,
  updates: Partial<Omit<TaskData, 'id' | 'createdAt'>>
): TaskData[] {
  return tasks.map((task) => 
    task.id === taskId 
      ? { ...task, ...updates, updatedAt: new Date().toISOString() } 
      : task
  );
}

/**
 * Toggle task completion status
 * @param tasks Current task list
 * @param taskId ID of task to toggle
 * @returns Updated task list
 */
export function toggleTaskCompletion(tasks: TaskData[], taskId: string): TaskData[] {
  return tasks.map((task) => 
    task.id === taskId 
      ? { 
          ...task, 
          isCompleted: !task.isCompleted, 
          updatedAt: new Date().toISOString() 
        } 
      : task
  );
}

/**
 * Delete a task
 * @param tasks Current task list
 * @param taskId ID of task to delete
 * @returns Updated task list
 */
export function deleteTask(tasks: TaskData[], taskId: string): TaskData[] {
  return tasks.filter((task) => task.id !== taskId);
} 