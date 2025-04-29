import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageConfig } from '@/lib/storage';
import type { TaskData } from '@/types/task';
import { 
  loadTasks as loadTasksFromApi, 
  saveTasks as saveTasksToApi,
  createTask,
  updateTask as updateTaskInApi,
  toggleTaskCompletion as toggleTaskCompletionInApi,
  deleteTask as deleteTaskFromApi
} from '../api/tasks-api';

type TaskState = {
  tasks: TaskData[];
  isLoading: boolean;
  initialized: boolean;
  isUpdating: Record<string, boolean>;
  
  // Actions
  addTask: (task: TaskData) => void;
  updateTask: (id: string, task: Partial<TaskData>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
  getTasks: () => Promise<TaskData[]>;
  getTasksByProject: (projectId: string, projectTasks: string[]) => TaskData[];
  getAllTasks: () => TaskData[];
  setUpdating: (taskId: string, isUpdating: boolean) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      initialized: false,
      isUpdating: {},
      
      addTask: (task) => {
        set((state) => ({ 
          tasks: [...state.tasks, task] 
        }));
        // Save tasks after adding
        get().saveTasks();
      },
      
      updateTask: (id, task) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        }));
        // Save tasks after updating
        get().saveTasks();
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
        // Save tasks after deleting
        get().saveTasks();
      },
      
      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { 
              ...t, 
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : undefined 
            } : t
          ),
        }));
        // Save tasks after toggling
        get().saveTasks();
      },
      
      loadTasks: async () => {
        try {
          set({ isLoading: true });
          const tasks = await loadTasksFromApi();
          set({ tasks, initialized: true });
        } catch (error) {
          console.error('Failed to load tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveTasks: async () => {
        try {
          set({ isLoading: true });
          await saveTasksToApi(get().tasks);
        } catch (error) {
          console.error('Failed to save tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getTasks: async () => {
        try {
          const tasks = await loadTasksFromApi();
          set({ tasks });
          return tasks;
        } catch (error) {
          console.error('Failed to get tasks:', error);
          throw error;
        }
      },

      getTasksByProject: (projectId: string, projectTasks: string[]): TaskData[] => {
        const { tasks } = get();
        if (!projectTasks || !Array.isArray(projectTasks)) {
          return [];
        }
        return tasks.filter(task => projectTasks.includes(task.id));
      },

      getAllTasks: () => {
        const { tasks } = get();
        return tasks;
      },

      setUpdating: (taskId: string, isUpdating: boolean) => {
        set((state) => ({
          isUpdating: {
            ...state.isUpdating,
            [taskId]: isUpdating
          }
        }));
      }
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => storageConfig),
    }
  )
); 